export function calculatePrice(distanceKm, weightKg) {
  return Math.round(50 + distanceKm * 10 + weightKg * 5);
}
