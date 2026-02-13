import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import { getCoordinates } from "./Location.js";
import { getRoadDistanceKm } from "./Distance.js";
import { calculatePrice } from "./Price.js";
// import openai from "./openai.js";
// import groq from "./groq.js";
import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});




import { db } from "./firebase.js";


const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  },
});


let lastParcel = null;

console.log(lastParcel);

const conversationId = 1;

const userId = 101;

const savemsg = async (text, senderType) => {
  if (!text || !senderType) {
    throw new Error("Missing required fields");
  }

  const messageRef = db.ref(`messages/${conversationId}`).push();

  await messageRef.set({
    text: text,
    senderType: senderType, 
    userId: userId,
    createdAt: Date.now()
  });

  return messageRef.key;
};


io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("sendMessage", async (message) => {
    try {
      await Promise.all(
        message.map(async (singlemsg) => {
          return await savemsg(singlemsg.text, singlemsg.sender);
        })
      );

      socket.emit("messageSaved", {
        success: true
      });
    } catch (err) {
      console.error("Error saving messages:", err);
      socket.emit("messageError", err.message);
    }
  });

  socket.on("chatgptQuestion", async (question) => {
    try {
      console.log("Received question:", question);
      console.log("lastParcel data:", lastParcel);

      if (!question || question.length > 500) {
        socket.emit("chatgptError", "Invalid question");
        return;
      }

      console.log("Calling Groq API...");

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              `You are a parcel delivery assistant.
              You can explain pricing, delivery logic, and give general estimates.
              If the user asks about other platforms, do NOT refuse.
              Instead, explain that prices vary and give a general comparison or guidance,
              while clearly stating that the shown price is for our service.
              Be helpful and business-friendly.
              Make Sure your Response is short and usefull for the client
              `,
          },
          {
            role: "user",
            content: `Parcel Details:
                - Source: ${lastParcel.source}
                - Destination: ${lastParcel.destination}
                - Distance: ${lastParcel.distance} km
                - Weight: ${lastParcel.weight} kg
                - Our Price: ₹${lastParcel.amount}
                
                User question: ${question}`,
          },
        ],
        max_tokens: 50,
      });

      console.log(" Groq Response:", completion.choices[0].message.content);

      socket.emit(
        "chatgptAnswer",
        completion.choices[0].message.content
        );
    } catch (err) {
      console.error("Groq Error:", err.message);
      console.error("Full error:", err);
      socket.emit("chatgptError", "Chat service unavailable");
    }
  });

  socket.on("parcelData", async ({ source, destination, weight }) => {
    try {
      if (!source || !destination || !weight) {
        throw new Error("Missing parcel data");
      }

      const src = await getCoordinates(source);
      const dest = await getCoordinates(destination);

      const distanceKm = await getRoadDistanceKm(src, dest);
      const amount = calculatePrice(distanceKm, Number(weight));

      lastParcel = {
        source,
        destination,
        distance: distanceKm.toFixed(2),
        weight,
        amount,
      };
      console.log(lastParcel);
      socket.emit("calculationResult", lastParcel);
    } catch (err) {
      console.error("Parcel Error:", err.message);
      socket.emit("calculationError", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Server running");
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
