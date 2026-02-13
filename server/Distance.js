export async function getRoadDistanceKm(source, destination) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${source.lon},${source.lat};${destination.lon},${destination.lat}` +
    `?overview=false`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("OSRM failed");

  const data = await res.json();
  if (!data.routes?.length) throw new Error("No route found");

  return data.routes[0].distance / 1000;
}
