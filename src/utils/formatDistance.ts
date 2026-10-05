export function formatDistance(meters: number) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
}

export function formatWalkingSummary(meters: number, seconds: number) {
  return `${formatDistance(meters)} · ${Math.max(1, Math.round(seconds / 60))} min`;
}
