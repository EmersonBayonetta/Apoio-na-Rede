import type { Establishment, NearbyPlace } from '../../types';
import { PlaceResultCard } from './PlaceResultCard';

export interface CatalogEntry { place?: NearbyPlace; establishment?: Establishment; addressLabel?: string }
export function PlaceCatalog({ entries, center, limit, showDistance = false, onOpenPlace }: { entries: CatalogEntry[]; center: [number, number]; limit?: number; showDistance?: boolean; onOpenPlace?: (establishment: Establishment) => void }) {
  // Equirectangular approximation: accurate enough inside a single city.
  const distance = (entry: CatalogEntry) => {
    const point = entry.establishment ?? entry.place;
    return point ? Math.hypot(point.latitude - center[0], (point.longitude - center[1]) * Math.cos(center[0] * Math.PI / 180)) * 111_320 : Infinity;
  };
  const results = [...entries].sort((a, b) => distance(a) - distance(b)).slice(0, limit);
  return <section className="mb-12" aria-label="Locais sugeridos">
    <p role="status" className="mb-4 text-sm">{results.length} {results.length === 1 ? 'local disponível' : 'locais disponíveis'}.</p>
    <ul className={`place-catalog-row${results.length === 1 ? ' is-single' : ''}`}>{results.map(entry => {
      const meters = distance(entry);
      return <li key={(entry.establishment ?? entry.place)?.id ?? entry.addressLabel}>
        <PlaceResultCard {...entry} distance={showDistance && !entry.addressLabel && Number.isFinite(meters) ? meters : undefined} onOpenPlace={onOpenPlace} />
      </li>;
    })}</ul>
  </section>;
}
