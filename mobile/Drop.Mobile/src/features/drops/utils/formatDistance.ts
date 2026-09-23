export const formatDistance = (
  meters: number,
) => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  const kilometers = meters / 1000;

  return `${kilometers.toFixed(1)} km`;
};