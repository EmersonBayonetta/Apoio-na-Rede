import { HybridMapPreview } from './HybridMapPreview';
import { Navigation } from 'lucide-react';
import type { Establishment, NearbyPlace } from '../../types';
import { directionsUrl } from '../../utils/directionsUrl';
import { AccessibilityIcons } from '../accessibility/AccessibilityIcons';
import { useAccessibility } from '../../context/AccessibilityContext';
import { compareRequirements, compatibilityLabel } from '../../utils/needsCompatibility';

export function PlaceResultCard({ place, establishment, addressLabel, onOpenPlace }: { place?: NearbyPlace; establishment?: Establishment; addressLabel?: string; onOpenPlace?: (establishment: Establishment) => void }) {
  const name = establishment?.nome ?? place?.nome ?? addressLabel ?? '';
  const address = establishment?.endereco ?? place?.endereco ?? addressLabel;
  const destination = establishment ?? place;
  const { requirements } = useAccessibility();
  // A searched address is not a place, so it gets no badge.
  const match = addressLabel ? null : compareRequirements(establishment?.criteria, requirements);
  return <article className="premium-card rounded-2xl overflow-hidden" aria-label={addressLabel ? 'Endereço selecionado' : name}>
    <HybridMapPreview latitude={destination?.latitude} longitude={destination?.longitude} name={name} />
    <p className="px-5 pt-2 text-xs text-slate-500">Vista aérea e localização do estabelecimento.</p>
    {place?.fonte === 'osm' && <p className="px-5 pt-1 text-xs text-slate-500">Dados do local: <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© colaboradores do OpenStreetMap</a>.</p>}
    <div className="p-5 space-y-4">
      <div><h2 className="text-lg font-bold">{name}</h2>{address !== name && <p className="mt-1 text-sm text-slate-600">{address}</p>}</div>
      {match && <p className="requirements-badge inline-flex flex-wrap gap-x-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800">
        {establishment ? compatibilityLabel(match) : 'Sem informações para seus requisitos'}
        {match.indispensaveisNaoAtendidos.length > 0 && <span className="text-rose-800">· Indispensável não atendido</span>}
      </p>}
      {establishment && <AccessibilityIcons establishment={establishment} />}
      <div className="flex flex-wrap gap-3">
        {establishment && onOpenPlace && <button type="button" onClick={() => onOpenPlace(establishment)} className="inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white">Ver acessibilidade e rota</button>}
        <a href={destination ? directionsUrl(destination) : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(name)}&travelmode=walking`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-900"><Navigation size={16} aria-hidden="true" />Abrir no Google Maps<span className="sr-only"> (abre em nova aba)</span></a>
      </div>
    </div>
  </article>;
}
