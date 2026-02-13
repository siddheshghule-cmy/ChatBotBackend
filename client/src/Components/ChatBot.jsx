import { useEffect, useRef, useState } from "react";

import { socket } from "./Socket";

const QUESTIONS = [
  {
    id: "name",
    text: "👤 What is your full name?",
    validate: (v) => v.trim().length >= 3,
    error: "Name must be at least 3 characters",
  },
  {
    id: "email",
    text: "📧 What is your email address?",
    validate: (v) => /\S+@\S+\.\S+/.test(v),
    error: "Invalid email format",
  },
  {
    id: "source",
    text: "📍 Source location of the parcel?",
    validate: (v) => v.trim().length > 2,
    error: "Enter a valid source location",
  },
  {
    id: "destination",
    text: "📍 Destination location of the parcel?",
    validate: (v) => v.trim().length > 2,
    error: "Enter a valid destination location",
  },
  {
    id: "weight",
    text: "⚖️ Weight of the parcel (kg)?",
    validate: (v) => !isNaN(v) && Number(v) > 0,
    error: "Enter a valid weight",
  },
];

console.log("Type Is:",typeof(QUESTIONS));

export default function App() {
  const [step, setStep] = useState(-1);
  const[gptMode,setgptMode]=useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "👋 Hi! I'll help you calculate your parcel journey.",
    },
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

    useEffect(() => {
      setTimeout(() => {
        setStep(0);
        pushBotMessage(QUESTIONS[0].text);
      }, 1000);
      
      }, []
    );
    
    useEffect(() => {
        socket.on("calculationResult", ({ distance, amount }) => {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: `🧾 Parcel Summary:
                👤 Name: ${answers.name}
                📍 Source: ${answers.source}
                📍 Destination: ${answers.destination}
                ⚖️ Weight: ${answers.weight} kg
                📏 Distance: ${distance} km\n
                💰 Amount: ₹${amount}`,

          },
        ]);
        setgptMode(true);
        } );


        socket.on("calculationError", (msg) => {
          setMessages((prev) => [
              ...prev,
              { sender: "bot", text: `❌ Error: ${msg}` },
          ]);
        });

        return () => {
          socket.off("calculationResult");
          socket.off("calculationError");
        };
        }, [answers]
    );
    
    useEffect(()=>{
      socket.emit("sendMessage",messages);
    },[messages]);
    

  function pushBotMessage(text) {
    setMessages((prev) => [...prev, { sender: "bot", text }]);
  }

  function pushUserMessage(text) {
    setMessages((prev) => [...prev, { sender: "user", text }]);
  }

  function handleSubmit(e) {
    e.preventDefault();

    if(gptMode){
      pushUserMessage(input);
      socket.emit("chatgptQuestion", input);
      setInput("");
      return;  
    }

    const q = QUESTIONS[step];

    if (!q.validate(input)) {
      setError(q.error);
      return;
    }

    pushUserMessage(input);

    const updatedAnswers = { ...answers, [q.id]: input };
    setAnswers(updatedAnswers);
    setInput("");
    setError("");

    if (step === QUESTIONS.length - 1) {
      pushBotMessage(
        "Thank you for the details.\n📦 Calculating the parcel journey..."
      );
      socket.emit("parcelData", updatedAnswers);
      return;
    }

    setTimeout(() => {
      setStep(step + 1);
      pushBotMessage(QUESTIONS[step + 1].text);
    }, 500);
  }
  useEffect(() => {
    socket.on("chatgptAnswer", (reply) => {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: reply }
      ]);
    });

    socket.on("chatgptError", (msg) => {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: `${msg}` }
      ]);
    });

    return () => {
      socket.off("chatgptAnswer");
      socket.off("chatgptError");
    };
  }, []);


  return (
    <>
      <style>{`
        @keyframes slideInBot {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInUser {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .animate-bot {
          animation: slideInBot 0.4s ease-out;
        }
        
        .animate-user {
          animation: slideInUser 0.4s ease-out;
        }
        
        .animate-fade {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
      
      <div style={styles.page}>
        <div style={styles.chatBox} className="animate-fade">
          
          <div style={styles.header}>
            <div style={styles.headerIcon}>📦</div>
            <div>
              <div style={styles.headerTitle}>Parcel Assistant</div>
              <div style={styles.headerSubtitle}>Fast & Reliable Shipping</div>
            </div>
          </div>

          <div style={styles.messages}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={msg.sender === "bot" ? "animate-bot" : "animate-user"}
                style={{
                  ...styles.messageRow,
                  justifyContent:
                    msg.sender === "bot" ? "flex-start" : "flex-end",
                  whiteSpace: "pre-line" 
                }}
              >
                <div
                  style={{
                    ...styles.bubble,
                    background: msg.sender === "bot" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                    color: "#fff",
                    boxShadow: msg.sender === "bot" 
                      ? "0 4px 15px rgba(102, 126, 234, 0.4)" 
                      : "0 4px 15px rgba(245, 87, 108, 0.4)",
                  }}
                >
                  {msg.text}
                </div>
                

              
              </div>
            ))}
            <div ref={messagesEndRef} />
            {error && <p style={styles.error} className="animate-bot">{error}</p>}
          </div>

          {step >= 0 && step < QUESTIONS.length && (
            <div style={styles.inputBar} onSubmit={handleSubmit}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your answer..."
                style={styles.input}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit(e);
                  }
                }}
              />
              <button 
                onClick={handleSubmit}
                style={styles.button}
                onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
              >
                Send
              </button>
            </div>
          )}
        </div>

        
      </div>
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width:"100vw",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background:"#ffff",
    padding: "20px",
  },
  header: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    borderRadius: "12px 12px 0 0",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  headerIcon: {
    width: "50px",
    height: "50px",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    backdropFilter: "blur(10px)",
  },
  headerTitle: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#fff",
    marginBottom: "4px",
  },
  headerSubtitle: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.8)",
  },
  chatBox: {
    width: "500px",
    maxWidth: "95vw",
    height: "650px",
    background: "#ffffff",
    display: "flex",
    flexDirection: "column",
    borderRadius: "12px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    overflow: "hidden",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    background: "linear-gradient(to bottom, #fdfbfb 0%, #ebedee 100%)",
  },
  messageRow: {
    display: "flex",
    marginBottom: "15px",
  },
  bubble: {
    maxWidth: "75%",
    padding: "12px 18px",
    borderRadius: "18px",
    fontSize: "15px",
    lineHeight: 1.5,
    fontWeight: "500",
    transition: "all 0.3s ease",
  },
  inputBar: {
    display: "flex",
    padding: "20px",
    borderTop: "1px solid #e0e0e0",
    background: "#fff",
    gap: "10px",
  },
  input: {
    flex: 1,
    padding: "14px 18px",
    fontSize: "15px",
    borderRadius: "25px",
    border: "2px solid #e0e0e0",
    outline: "none",
    transition: "all 0.3s ease",
    backgroundColor:"#fff",
    color:'black'

  },
  button: {
    padding: "14px 30px",
    fontSize: "15px",
    borderRadius: "25px",
    border: "none",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
  },
  error: {
    marginTop: "15px",
    padding: "12px 20px",
    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    color: "#fff",
    textAlign: "center",
    borderRadius: "10px",
    fontWeight: "500",
    boxShadow: "0 4px 15px rgba(245, 87, 108, 0.4)",
  },
};