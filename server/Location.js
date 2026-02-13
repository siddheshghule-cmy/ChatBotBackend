export async function getCoordinates(place) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    place
  )}&format=json&limit=1`;

  const res = await fetch(url, {
    headers: { "User-Agent": "parcel-app/1.0" },
  });

  const data = await res.json();
  if (!data.length) throw new Error("Location not found");

  return {
    lat: Number(data[0].lat),
    lon: Number(data[0].lon),
  };
}
