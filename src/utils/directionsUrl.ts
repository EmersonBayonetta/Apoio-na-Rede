export function directionsUrl(destination: { latitude: number; longitude: number; place_id?: string }): string {
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  url.searchParams.set('destination', `${destination.latitude},${destination.longitude}`);
  // Identificadores do OpenStreetMap não são Place IDs do Google.
  if (destination.place_id && !destination.place_id.startsWith('osm-')) url.searchParams.set('destination_place_id', destination.place_id);
  url.searchParams.set('travelmode', 'walking');
  return url.href;
}
