import { ArrowUpRight, MapPin } from 'lucide-react';
import type { NearbyPlace } from '../types';
import { MAP_CATEGORIES } from '../data/mapCategories';

export function PlaceDiscoveryCards({ places, onSelect }: { places: NearbyPlace[]; onSelect: (place: NearbyPlace) => void }) {
  if (!places.length) return null;
  return <section className="discovery-places" aria-labelledby="discovery-places-title">
    <div className="section-heading"><div><span className="section-kicker">PERTO DE VOCÊ</span><h2 id="discovery-places-title">Lugares para descobrir</h2></div><a href="#results-section">Ver no mapa <ArrowUpRight size={16} aria-hidden="true" /></a></div>
    <div className="place-discovery-grid">{places.slice(0, 4).map(place => {
      const category = MAP_CATEGORIES[place.categoria];
      const Icon = category.icon;
      return <button key={place.id} type="button" className="place-discovery-card" onClick={() => onSelect(place)}>
        <div className="place-card-visual" style={{ '--place-color': category.color } as React.CSSProperties}><span className="place-card-circle" /><Icon size={42} strokeWidth={1.3} aria-hidden="true" /><span className="place-card-arrow"><ArrowUpRight size={16} aria-hidden="true" /></span></div>
        <div className="place-card-body"><h3>{place.nome}</h3><p>{category.label}</p><span><MapPin size={12} aria-hidden="true" />Cataguases, MG</span><strong>Consultar acessibilidade <ArrowUpRight size={13} aria-hidden="true" /></strong></div>
      </button>;
    })}</div>
  </section>;
}
