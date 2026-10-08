import { CheckCircle2, Clock3, Footprints, HelpCircle, MapPin, Navigation } from 'lucide-react';
import type { Establishment, NearbyPlace } from '../../types';
import { MAP_CATEGORIES } from '../../data/mapCategories';
import { directionsUrl } from '../../utils/directionsUrl';
import { formatDistance } from '../../utils/formatDistance';
import { imageFallback } from '../../utils/imageFallback';
import { AccessibilityIcons } from '../accessibility/AccessibilityIcons';
import { useAccessibility } from '../../context/AccessibilityContext';
import { compareRequirements, compatibilityLabel } from '../../utils/needsCompatibility';

const STATUS = {
  verificado: { label: 'Conferido', Icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-800' },
  pendente: { label: 'Em verificação', Icon: Clock3, className: 'bg-amber-50 text-amber-900' },
  desconhecido: { label: 'Sem informações', Icon: HelpCircle, className: 'bg-slate-100 text-slate-700' },
};

export function PlaceResultCard({ place, establishment, addressLabel, distance, onOpenPlace }: { place?: NearbyPlace; establishment?: Establishment; addressLabel?: string; distance?: number; onOpenPlace?: (establishment: Establishment) => void }) {
  const name = establishment?.nome ?? place?.nome ?? addressLabel ?? '';
  const address = establishment?.endereco ?? place?.endereco ?? addressLabel;
  const destination = establishment ?? place;
  const category = MAP_CATEGORIES[destination?.categoria ?? 'servico_publico'];
  const CategoryIcon = addressLabel ? MapPin : category.icon;
  const photo = establishment?.fotos?.[0] ?? place?.foto;
  const status = STATUS[establishment ? (establishment.status === 'verificado' ? 'verificado' : 'pendente') : 'desconhecido'];
  const mapsUrl = destination ? directionsUrl(destination) : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(name)}&travelmode=walking`;
  const canOpen = Boolean((establishment || place) && onOpenPlace);
  const { requirements } = useAccessibility();
  // A searched address is not a place, so it gets no badge.
  const match = addressLabel ? null : compareRequirements(establishment?.criteria, requirements);

  return <article className="place-card premium-card rounded-2xl border" aria-label={addressLabel ? 'Endereço selecionado' : name}>
    <div className="place-card-media" style={{ '--place-color': category.color } as React.CSSProperties}>
      {photo ? <img src={photo} alt="" loading="lazy" onError={imageFallback} /> : <CategoryIcon size={40} strokeWidth={1.4} aria-hidden="true" />}
      {!addressLabel && <span className={`place-card-status ${status.className}`}><status.Icon size={14} aria-hidden="true" />{establishment?.demonstracao ? 'Demonstração' : establishment?.fonte_url ? 'Dados públicos' : status.label}</span>}
      {distance !== undefined && <span className="place-card-distance"><Footprints size={13} aria-hidden="true" />{formatDistance(distance)}<span className="sr-only"> de você</span></span>}
      {canOpen && !establishment?.demonstracao && <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="place-card-maps" title="Abrir no Google Maps">
        <Navigation size={18} aria-hidden="true" /><span className="sr-only">Abrir no Google Maps (abre em nova aba)</span>
      </a>}
    </div>
    <div className="place-card-content">
      <p className="truncate text-xs font-semibold text-slate-600" title={addressLabel ? undefined : category.label}>{addressLabel ? 'Endereço pesquisado' : category.label}</p>
      <h2 className="place-card-title" title={name}>{name}</h2>
      {establishment?.status === 'verificado' && establishment.informado_responsavel && <p className="text-xs font-semibold text-emerald-800">Informado pelo responsável</p>}
      {address && address !== name && <p className="place-card-address text-slate-600" title={address}><MapPin size={14} aria-hidden="true" /><span>{address}</span></p>}
      {match && <p className="requirements-badge inline-flex flex-wrap gap-x-1 self-start rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">
        {establishment ? compatibilityLabel(match) : 'Sem informações para seus requisitos'}
        {match.indispensaveisNaoAtendidos.length > 0 && <span className="text-rose-800">· Indispensável não atendido</span>}
      </p>}
      {establishment ? <AccessibilityIcons establishment={establishment} /> : !addressLabel && <p className="text-sm text-slate-600">Acessibilidade ainda não informada</p>}
      {place?.fonte === 'osm' && <p className="text-xs text-slate-500">Dados: <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap</a></p>}
      <div className="place-card-actions">
        {canOpen
          ? <button type="button" onClick={() => onOpenPlace?.(establishment ?? {
              id: `external-${place!.id}`, place_id: place!.place_id || place!.id, nome: place!.nome, categoria: place!.categoria,
              endereco: place!.endereco, cidade: 'Cataguases', estado: 'MG', latitude: place!.latitude, longitude: place!.longitude,
              descricao: 'Local encontrado no mapa. A comunidade pode informar os recursos de acessibilidade.', fotos: place!.foto ? [place!.foto] : [],
              status: 'pendente', nota_media: 0, total_avaliacoes: 0, external: true,
            })} className="place-card-action bg-blue-700 text-white">{establishment?.demonstracao ? 'Ver exemplo de cadastro' : 'Ver acessibilidade e rota'}</button>
          : <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="place-card-action border border-slate-300 text-slate-900"><Navigation size={16} aria-hidden="true" />Abrir no Google Maps<span className="sr-only"> (abre em nova aba)</span></a>}
      </div>
    </div>
  </article>;
}
