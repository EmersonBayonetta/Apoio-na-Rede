import React from 'react';
import { Circle, CircleMarker, MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Establishment, AccessibleRoute, NearbyPlace } from '../types';
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

const FitRoute: React.FC<{ coordinates: [number, number][] }> = ({ coordinates }) => {
  const map = useMap();
  React.useEffect(() => {
    if (coordinates.length > 1) {
      map.fitBounds(L.latLngBounds(coordinates), { padding: [36, 36], maxZoom: 16 });
    }
  }, [coordinates, map]);
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
      box-shadow: 0 3px 10px rgba(8,55,70,0.24);
      border: ${isSelected ? '4px solid #70e2d1' : '3px solid white'};
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
  searchedAddress?: { latitude: number; longitude: number; label: string } | null;
  nearbyPlaces?: NearbyPlace[];
  userLocation?: { latitude: number; longitude: number; accuracy: number } | null;
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
  center = [-21.3924, -42.6896], // Centro de Cataguases, Minas Gerais
  zoom = 14,
  heightClass = 'h-[550px]',
  searchedAddress,
  nearbyPlaces = [],
  userLocation,
}) => {
  const mapCenter: [number, number] = searchedAddress
    ? [searchedAddress.latitude, searchedAddress.longitude]
    : selectedEstablishment
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
        {activeRoute && <FitRoute coordinates={activeRoute.coordenadas} />}

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
          <>
            <Polyline
              positions={activeRoute.coordenadas}
              pathOptions={{
                color: '#0b9b8c',
                weight: 6,
                opacity: 0.9,
                dashArray: activeRoute.auditada === false ? '8, 8' : undefined,
              }}
            />
            <CircleMarker
              center={activeRoute.coordenadas[0]}
              radius={8}
              pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#064b5f', fillOpacity: 1 }}
            >
              <Tooltip direction="top">Sua localização</Tooltip>
            </CircleMarker>
          </>
        )}

        {searchedAddress && (
          <CircleMarker
            center={[searchedAddress.latitude, searchedAddress.longitude]}
            radius={10}
            pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#0b9b8c', fillOpacity: 1 }}
          >
            <Tooltip permanent direction="top">{searchedAddress.label}</Tooltip>
          </CircleMarker>
        )}

        {userLocation && (
          <>
            <Circle
              center={[userLocation.latitude, userLocation.longitude]}
              radius={userLocation.accuracy}
              pathOptions={{ color: '#087b72', weight: 1, fillColor: '#70e2d1', fillOpacity: 0.13 }}
            />
            <CircleMarker
              center={[userLocation.latitude, userLocation.longitude]}
              radius={9}
              pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#087b72', fillOpacity: 1 }}
            >
              <Tooltip permanent direction="top">Você está aqui</Tooltip>
            </CircleMarker>
          </>
        )}

        {nearbyPlaces.map((place) => (
          <Marker
            key={place.id}
            position={[place.latitude, place.longitude]}
            icon={createCustomIcon(place.categoria, false)}
          >
            <Popup>
              <div className="max-w-[240px] text-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">{place.categoria.replaceAll('_', ' ')}</span>
                <h3 className="mt-1 text-sm font-bold text-slate-900">{place.nome}</h3>
                <p className="mt-1 text-xs text-slate-500">{place.endereco}</p>
                <p className="mt-2 text-[10px] text-slate-400">Dados colaborativos do OpenStreetMap</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
