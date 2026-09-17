import { useEffect, useState } from 'react';
import type { Establishment, NearbyPlace } from '../../types';
import { streetViewImage, type StreetViewScene } from '../../services/streetViewService';
import { PlaceResultCard } from './PlaceResultCard';

export interface CatalogEntry { place?: NearbyPlace; establishment?: Establishment; addressLabel?: string }
export function StreetViewCatalog({ entries, center, limit }: { entries: CatalogEntry[]; center: [number, number]; limit?: number }) {
  const [results, setResults] = useState<{ entry: CatalogEntry; image: StreetViewScene }[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setResults([]); setLoading(true); setFailed(false);
    async function load() {
      const distance = (entry: CatalogEntry) => {
        const point = entry.establishment ?? entry.place;
        return point ? (point.latitude - center[0]) ** 2 + ((point.longitude - center[1]) * Math.cos(center[0] * Math.PI / 180)) ** 2 : Infinity;
      };
      const sorted = [...entries].sort((a, b) => distance(a) - distance(b));
      const found: { entry: CatalogEntry; image: StreetViewScene }[] = [];
      for (const entry of sorted) {
        if (cancelled || found.length >= (limit ?? Infinity)) break;
        const point = entry.establishment ?? entry.place;
        if (!point) continue;
        try {
          const image = await streetViewImage(point.latitude, point.longitude);
          if (cancelled) return;
          if (image) { found.push({ entry, image }); setResults([...found]); }
        } catch { if (!cancelled) setFailed(true); break; }
      }
      if (!cancelled) setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [entries, center, limit, attempt]);
  return <section className="mb-12">
    <p role="status" className="mb-4 text-sm">{loading ? 'Verificando imagens do Street View…' : `${results.length} locais com Street View disponíveis.`}</p>
    {failed && <p role="alert" className="mb-4 text-sm">Não foi possível carregar o Street View agora. <button type="button" className="underline" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button></p>}
    {!loading && !failed && results.length === 0 && <p>Não encontramos imagens externas para estes resultados. Tente outro endereço.</p>}
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">{results.map(({ entry, image }) => <PlaceResultCard key={(entry.establishment ?? entry.place)!.id} {...entry} streetViewScene={image} />)}</div>
  </section>;
}
