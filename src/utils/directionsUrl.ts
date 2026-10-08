export function directionsUrl(destination: { latitude: number; longitude: number; place_id?: string; coordenadas_confirmadas?:boolean; endereco?:string; cidade?:string; estado?:string }): string {
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  url.searchParams.set('destination', destination.coordenadas_confirmadas===false&&destination.endereco?[destination.endereco,destination.cidade,destination.estado].filter(Boolean).join(', '):`${destination.latitude},${destination.longitude}`);
  // Identificadores do OpenStreetMap não são Place IDs do Google.
  if (destination.place_id && !destination.place_id.startsWith('osm-')) url.searchParams.set('destination_place_id', destination.place_id);
  url.searchParams.set('travelmode', 'walking');
  return url.href;
}
