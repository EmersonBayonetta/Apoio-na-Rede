// Addresses are intentionally excluded: a shop on Praça X remains eligible.
export function isIndoorPlace(place: { nome: string }, types: string[] = [], tags: Record<string, string> = {}): boolean {
  const outdoorTypes = ['park', 'national_park', 'city_park', 'playground', 'beach', 'campground', 'zoo', 'amusement_park', 'stadium', 'bus_stop', 'taxi_stand'];
  if (types.some(type => outdoorTypes.includes(type))) return false;
  if (tags.place === 'square' || tags.indoor === 'no' || tags.highway === 'bus_stop'
    || ['park', 'garden', 'playground', 'pitch', 'stadium', 'nature_reserve'].includes(tags.leisure)
    || ['beach', 'wood', 'water'].includes(tags.natural)
    || tags.tourism === 'camp_site' || tags.public_transport === 'platform') return false;
  const name = place.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  return !/^(pracas?|parques?|jardim botanico|praia|ponto de onibus|ponto de taxi|estadio|camping)\b/.test(name);
}
