export interface RouteDestination { id: string; nome: string; latitude: number; longitude: number; cidade?: string }

interface WalkingResponse {
  routes?: { geometry?: { coordinates?: number[][] }; distance: number; duration: number }[];
}

export async function fetchWalkingRoute(origin: { latitude: number; longitude: number }, destination: RouteDestination, signal?: AbortSignal) {
  const validPoint = (point: { latitude: number; longitude: number }) => Number.isFinite(point.latitude)
    && Number.isFinite(point.longitude) && Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180;
  if (!validPoint(origin) || !validPoint(destination)) throw new Error('Coordenadas inválidas');
  const endpoint = `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&steps=true`;
  const timeout = AbortSignal.timeout(20000);
  const response = await fetch(endpoint, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  if (!response.ok) throw new Error('Serviço de rotas indisponível');
  const data = await response.json() as WalkingResponse;
  const result = data.routes?.[0];
  const points = result?.geometry?.coordinates;
  if (!result || !Array.isArray(points) || points.length < 2 || !Number.isFinite(result.distance) || !Number.isFinite(result.duration)
    || result.distance < 0 || result.duration < 0
    || points.some(point => !Array.isArray(point) || point.length < 2 || !validPoint({ longitude: point[0], latitude: point[1] }))) throw new Error('Rota não encontrada');
  return { distance: result.distance, duration: result.duration, coordinates: points.map(([lng, lat]): [number, number] => [lat, lng]) };
}
