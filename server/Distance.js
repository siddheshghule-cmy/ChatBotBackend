export async function getRoadDistanceKm(source, destination) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${source.lon},${source.lat};${destination.lon},${destination.lat}` +
    `?overview=false`;
  
  console.log("Fetching OSRM:", url);
  
  try {
    const res = await fetch(url);
    console.log("OSRM Response Status:", res.status);
    if (!res.ok) throw new Error(`OSRM failed: ${res.status}`);
    const data = await res.json();
    console.log("OSRM Data:", data);
    if (!data.routes?.length) throw new Error("No route found");
    return data.routes[0].distance / 1000;
  } catch (error) {
    console.error("OSRM Error Details:", error.message);
    throw error;
  }
}
