import { useEffect, useRef, useState } from 'react';
import type { Establishment, NearbyPlace } from '../../types';
import { PlaceResultCard } from './PlaceResultCard';

export interface CatalogEntry { place?: NearbyPlace; establishment?: Establishment; addressLabel?: string }
export function PlaceCatalog({ entries, center, showDistance = false, onOpenPlace }: { entries: CatalogEntry[]; center: [number, number]; showDistance?: boolean; onOpenPlace?: (establishment: Establishment) => void }) {
  const [visibleCount, setVisibleCount] = useState(20);
  const rowRef = useRef<HTMLUListElement>(null);
  const endRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const row = rowRef.current;
    const end = endRef.current;
    if (!row || !end || visibleCount >= entries.length) return;
    const observer = new IntersectionObserver(observations => {
      if (observations.some(observation => observation.isIntersecting)) {
        observer.disconnect();
        setVisibleCount(count => Math.min(count + 20, entries.length));
      }
    }, { root: row, rootMargin: '0px 300px', threshold: 0 });
    observer.observe(end);
    return () => observer.disconnect();
  }, [visibleCount, entries.length]);
  // Equirectangular approximation: accurate enough inside a single city.
  const distance = (entry: CatalogEntry) => {
    const point = entry.establishment ?? entry.place;
    return point && entry.establishment?.coordenadas_confirmadas!==false ? Math.hypot(point.latitude - center[0], (point.longitude - center[1]) * Math.cos(center[0] * Math.PI / 180)) * 111_320 : Infinity;
  };
  const results = [...entries].sort((a, b) => distance(a) - distance(b)).slice(0, visibleCount);
  return <section className="mb-12" aria-label="Locais sugeridos">
    <ul ref={rowRef} className={`place-catalog-row${results.length === 1 ? ' is-single' : ''}`} aria-label="Resultados de locais">{results.map(entry => {
      const meters = distance(entry);
      return <li key={(entry.establishment ?? entry.place)?.id ?? entry.addressLabel}>
        <PlaceResultCard {...entry} distance={showDistance && !entry.addressLabel && !entry.establishment?.demonstracao && Number.isFinite(meters) ? meters : undefined} onOpenPlace={onOpenPlace} />
      </li>;
    })}{results.length < entries.length && <li ref={endRef} aria-hidden="true" style={{ flex: '0 0 1px', scrollSnapAlign: 'none' }} />}</ul>
    <p role="status" className="sr-only">{results.length} de {entries.length} locais carregados</p>
  </section>;
}
