const insideCity = (latitude: number, longitude: number) => Number.isFinite(latitude) && Number.isFinite(longitude)
  && latitude >= -21.55 && latitude <= -21.20 && longitude >= -42.90 && longitude <= -42.50;

export async function locateAddress(query: string) {
  const providers = [
    { url: `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(query)}`,
      point: (data: unknown) => {
        const rows = data as { lat?: string; lon?: string }[];
        return { latitude: Number(rows?.[0]?.lat), longitude: Number(rows?.[0]?.lon) };
      } },
    { url: `https://photon.komoot.io/api/?limit=1&lat=-21.3924&lon=-42.6896&q=${encodeURIComponent(query)}`,
      point: (data: unknown) => {
        const response = data as { features?: { geometry?: { coordinates?: number[] } }[] };
        const coordinates = response?.features?.[0]?.geometry?.coordinates;
        return { latitude: Number(coordinates?.[1]), longitude: Number(coordinates?.[0]) };
      } },
  ];
  for (const provider of providers) {
    try {
      const response = await fetch(provider.url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) continue;
      const point = provider.point(await response.json());
      if (insideCity(point.latitude, point.longitude)) return point;
    } catch {
      // Uma falha de rede ou resposta inválida não impede consultar a alternativa.
    }
  }
  throw new Error('Coordenadas não encontradas');
}
