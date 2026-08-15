import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Establishment, AccessibleRoute } from '../types';
import {
  Utensils,
  Stethoscope,
  Landmark,
  ShoppingBag,
  Building2,
  Bath,
  GraduationCap,
  Bus,
  Hotel,
  Navigation,
} from 'lucide-react';
import { renderToString } from 'react-dom/server';
import { DisabilityBadge } from './DisabilityBadge';
import { VerifiedBadge } from './VerifiedBadge';

// Helper para centralizar o mapa
const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

// Ícones de categoria para os marcadores do mapa
const getCategoryIconSvg = (category: string) => {
  switch (category) {
    case 'alimentacao':
      return renderToString(<Utensils size={18} color="white" />);
    case 'saude':
      return renderToString(<Stethoscope size={18} color="white" />);
    case 'lazer_cultura':
      return renderToString(<Landmark size={18} color="white" />);
    case 'comercio_loja':
      return renderToString(<ShoppingBag size={18} color="white" />);
    case 'servico_publico':
      return renderToString(<Building2 size={18} color="white" />);
    case 'banheiro_adaptado':
      return renderToString(<Bath size={18} color="white" />);
    case 'educacao':
      return renderToString(<GraduationCap size={18} color="white" />);
    case 'transporte_mobilidade':
      return renderToString(<Bus size={18} color="white" />);
    case 'hospedagem':
      return renderToString(<Hotel size={18} color="white" />);
    default:
      return renderToString(<Navigation size={18} color="white" />);
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'alimentacao':
      return '#ea580c'; // Laranja
    case 'saude':
      return '#0284c7'; // Azul
    case 'lazer_cultura':
      return '#7c3aed'; // Roxo
    case 'comercio_loja':
      return '#059669'; // Verde
    case 'banheiro_adaptado':
      return '#0891b2'; // Ciano
    default:
      return '#2563eb'; // Azul padrão
  }
};

const createCustomIcon = (category: string, isSelected: boolean) => {
  const color = getCategoryColor(category);
  const iconSvg = getCategoryIconSvg(category);
  const size = isSelected ? 44 : 36;

  const html = `
    <div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      border: 3px solid white;
      transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
      transition: all 0.2s ease;
    ">
      ${iconSvg}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

interface MapLeafletProps {
  establishments?: Establishment[];
  selectedEstablishment?: Establishment | null;
  onSelectEstablishment?: (establishment: Establishment) => void;
  activeRoute?: AccessibleRoute | null;
  interactivePointSelection?: boolean;
  onPointSelected?: (lat: number, lng: number) => void;
  center?: [number, number];
  zoom?: number;
  heightClass?: string;
}

// Sub-componente para clique de seleção de coordenadas (modo comerciante)
const LocationPickerHandler: React.FC<{ onPointSelected: (lat: number, lng: number) => void }> = ({
  onPointSelected,
}) => {
  const map = useMap();
  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleClick = (e: any) => {
      onPointSelected(e.latlng.lat, e.latlng.lng);
    };
    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onPointSelected]);
  return null;
};

export const MapLeaflet: React.FC<MapLeafletProps> = ({
  establishments = [],
  selectedEstablishment,
  onSelectEstablishment,
  activeRoute,
  interactivePointSelection = false,
  onPointSelected,
  center = [-23.5614, -46.6559], // Av. Paulista como centro padrão
  zoom = 14,
  heightClass = 'h-[550px]',
}) => {
  const mapCenter: [number, number] = selectedEstablishment
    ? [selectedEstablishment.latitude, selectedEstablishment.longitude]
    : center;

  return (
    <div className={`w-full ${heightClass} rounded-3xl overflow-hidden shadow-inner border border-slate-200 relative`}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <ChangeView center={mapCenter} zoom={zoom} />

        {/* Tile Layer OpenStreetMap Standard */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> colaboradores'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {interactivePointSelection && onPointSelected && (
          <LocationPickerHandler onPointSelected={onPointSelected} />
        )}

        {/* Marcadores dos Estabelecimentos */}
        {establishments.map((est) => {
          const isSelected = selectedEstablishment?.id === est.id;
          const icon = createCustomIcon(est.categoria, isSelected);

          // Tipos de deficiência atendidos
          const supportedTypes = Array.from(
            new Set(est.criteria?.filter((c) => c.presente).map((c) => c.tipo_deficiencia) || [])
          );

          return (
            <Marker
              key={est.id}
              position={[est.latitude, est.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  if (onSelectEstablishment) onSelectEstablishment(est);
                },
              }}
            >
              <Popup className="accessible-popup">
                <div className="p-1 max-w-[260px] text-slate-800">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      {est.categoria.replace('_', ' ')}
                    </span>
                    <VerifiedBadge status={est.status} />
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 leading-tight mb-1">
                    {est.nome}
                  </h3>

                  <p className="text-xs text-slate-500 mb-2 line-clamp-2">
                    {est.endereco} - {est.bairro || est.cidade}
                  </p>

                  {/* Badges de Acessibilidade */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {supportedTypes.slice(0, 4).map((type) => (
                      <DisabilityBadge key={type} type={type} size="sm" showLabel={false} />
                    ))}
                  </div>

                  {onSelectEstablishment && (
                    <button
                      type="button"
                      onClick={() => onSelectEstablishment(est)}
                      className="w-full py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Ver Detalhes Completos
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Traçado de Rota Acessível */}
        {activeRoute && (
          <Polyline
            positions={activeRoute.coordenadas}
            pathOptions={{
              color: '#2563eb',
              weight: 6,
              opacity: 0.85,
              dashArray: '8, 8',
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};
