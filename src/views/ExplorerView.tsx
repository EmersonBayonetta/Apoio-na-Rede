import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Establishment, FilterState, DisabilityType, EstablishmentCategory, NearbyPlace } from '../types';
import { StorageService } from '../services/storageService';
import { useAccessibility } from '../context/AccessibilityContext';
import { MapLeaflet } from '../components/MapLeaflet';
import { DisabilityBadge } from '../components/DisabilityBadge';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { VoiceSearchButton } from '../components/VoiceSearchButton';
import { AudioReaderButton } from '../components/AudioReaderButton';
import {
  Search,
  Map,
  List,
  MapPin,
  Star,
  SlidersHorizontal,
  ChevronRight,
  RotateCcw,
  CalendarDays,
  AlertCircle,
  LoaderCircle,
  Navigation,
  Route as RouteIcon,
  LocateFixed,
  Utensils,
  Stethoscope,
  Landmark,
  ShoppingBag,
  Building2,
  Bath,
  GraduationCap,
  Bus,
  Hotel,
} from 'lucide-react';

interface ExplorerViewProps {
  onSelectEstablishment: (establishment: Establishment) => void;
}

interface AddressSuggestion {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  kind?: 'address' | 'place';
  latitude?: number;
  longitude?: number;
  category?: EstablishmentCategory;
  typeLabel?: string;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface PhotonFeature {
  properties?: Record<string, string | undefined>;
  geometry?: { coordinates?: number[] };
}

const CATEGORIES: { id: EstablishmentCategory | 'todas'; label: string }[] = [
  { id: 'todas', label: 'Todas as Categorias' },
  { id: 'alimentacao', label: 'Alimentação' },
  { id: 'saude', label: 'Saúde & Clínicas' },
  { id: 'lazer_cultura', label: 'Lazer & Cultura' },
  { id: 'comercio_loja', label: 'Comércio & Lojas' },
  { id: 'servico_publico', label: 'Serviço Público' },
  { id: 'banheiro_adaptado', label: 'Banheiro Adaptado' },
  { id: 'hospedagem', label: 'Hospedagem' },
  { id: 'transporte_mobilidade', label: 'Transporte' },
];

const CATAGUASES_CENTER: [number, number] = [-21.3924, -42.6896];
const ADDRESS_INDEX_CACHE_KEY = 'apoio_cataguases_urban_index_v3';

const normalizeSearchText = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim();

const categoryIcons: Record<EstablishmentCategory, React.ElementType> = {
  alimentacao: Utensils,
  saude: Stethoscope,
  lazer_cultura: Landmark,
  comercio_loja: ShoppingBag,
  servico_publico: Building2,
  banheiro_adaptado: Bath,
  educacao: GraduationCap,
  transporte_mobilidade: Bus,
  hospedagem: Hotel,
};

const inferCategory = (tags: Record<string, string>): EstablishmentCategory => {
  if (tags.shop) return 'comercio_loja';
  if (tags.tourism === 'hotel' || tags.tourism === 'hostel' || tags.tourism === 'guest_house') return 'hospedagem';
  if (tags.amenity === 'toilets') return 'banheiro_adaptado';
  if (['hospital', 'clinic', 'doctors', 'dentist', 'pharmacy'].includes(tags.amenity)) return 'saude';
  if (['restaurant', 'cafe', 'fast_food', 'bar', 'food_court'].includes(tags.amenity)) return 'alimentacao';
  if (['school', 'college', 'university', 'kindergarten', 'library'].includes(tags.amenity)) return 'educacao';
  if (tags.public_transport || tags.highway === 'bus_stop' || tags.amenity === 'bus_station') return 'transporte_mobilidade';
  if (tags.leisure || tags.tourism) return 'lazer_cultura';
  return 'servico_publico';
};

const overpassFilters: Record<EstablishmentCategory, string[]> = {
  alimentacao: ['["amenity"~"restaurant|cafe|fast_food|bar|food_court"]'],
  saude: ['["amenity"~"hospital|clinic|doctors|dentist|pharmacy"]'],
  lazer_cultura: ['["leisure"]', '["tourism"~"museum|gallery|attraction|arts_centre"]'],
  comercio_loja: ['["shop"]'],
  servico_publico: ['["amenity"~"townhall|courthouse|post_office|bank|police|fire_station|community_centre"]', '["office"]'],
  banheiro_adaptado: ['["amenity"="toilets"]'],
  educacao: ['["amenity"~"school|college|university|kindergarten|library"]'],
  transporte_mobilidade: ['["public_transport"]', '["highway"="bus_stop"]', '["amenity"="bus_station"]'],
  hospedagem: ['["tourism"~"hotel|hostel|guest_house|motel"]'],
};

const distanceInMeters = (a: [number, number], b: [number, number]) => {
  const toRad = (value: number) => value * Math.PI / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

export const ExplorerView: React.FC<ExplorerViewProps> = ({ onSelectEstablishment }) => {
  const { settings, accessibilityPreferences } = useAccessibility();
  const [viewMode, setViewMode] = useState<'map' | 'list'>(settings.preferredView);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [suggestedRoute, setSuggestedRoute] = useState<import('../types').AccessibleRoute | null>(null);
  const [routeStatus, setRouteStatus] = useState<'idle' | 'locating' | 'routing' | 'ready' | 'error'>('idle');
  const [routeMessage, setRouteMessage] = useState('');
  const routeRequestRef = useRef(0);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [cityAddressIndex, setCityAddressIndex] = useState<AddressSuggestion[]>([]);
  const [isLoadingAddressIndex, setIsLoadingAddressIndex] = useState(true);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [addressMessage, setAddressMessage] = useState('');
  const [searchedAddress, setSearchedAddress] = useState<{ latitude: number; longitude: number; label: string } | null>(null);
  const skipAddressLookupRef = useRef(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [locationMessage, setLocationMessage] = useState('Solicitando sua localização…');
  const [placesSearchCenter, setPlacesSearchCenter] = useState<[number, number]>(CATAGUASES_CENTER);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [placesMessage, setPlacesMessage] = useState('');

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EstablishmentCategory | 'todas'>('todas');
  const [selectedCity, setSelectedCity] = useState<string>('Cataguases');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [selectedDisabilities, setSelectedDisabilities] = useState<DisabilityType[]>(accessibilityPreferences);

  // Reaplica as preferências persistidas neste navegador.
  useEffect(() => {
    setSelectedDisabilities(accessibilityPreferences);
  }, [accessibilityPreferences]);

  useEffect(() => {
    setViewMode(settings.preferredView);
  }, [settings.preferredView]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const filters: Partial<FilterState> = {
        searchQuery,
        category: selectedCategory,
        city: selectedCity,
        onlyVerified,
        selectedDisabilities,
      };
      const list = await StorageService.getEstablishments(filters);
      setEstablishments(list);
    } catch (err) {
      console.error(err);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedCity, onlyVerified, selectedDisabilities]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationMessage('Geolocalização não disponível neste navegador.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setUserLocation(nextLocation);
        const insideCataguases = nextLocation.latitude >= -21.55 && nextLocation.latitude <= -21.20
          && nextLocation.longitude >= -42.90 && nextLocation.longitude <= -42.50;
        setLocationMessage(insideCataguases
          ? `Localização atualizada, precisão aproximada de ${Math.round(nextLocation.accuracy)} metros.`
          : 'Sua localização foi encontrada fora da região de Cataguases; o mapa permanece focado na cidade.');
        if (insideCataguases) {
          setPlacesSearchCenter((previous) => distanceInMeters(previous, [nextLocation.latitude, nextLocation.longitude]) > 350
            ? [nextLocation.latitude, nextLocation.longitude]
            : previous);
        }
      },
      (error) => {
        setLocationMessage(error.code === 1
          ? 'Permita o acesso à localização para ver sua posição em tempo real.'
          : 'Não foi possível atualizar sua localização agora.');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadNearbyPlaces = async () => {
      setIsLoadingPlaces(true);
      setPlacesMessage('Consultando locais próximos…');
      try {
        const filters = selectedCategory === 'todas'
          ? Array.from(new Set(Object.values(overpassFilters).flat()))
          : overpassFilters[selectedCategory];
        const [latitude, longitude] = placesSearchCenter;
        const selectors = filters.map((filter) => `nwr${filter}["name"](around:7000,${latitude},${longitude});`).join('');
        const query = `[out:json][timeout:25];(${selectors});out center tags;`;
        const endpoints = [
          'https://overpass-api.de/api/interpreter',
          'https://overpass.kumi.systems/api/interpreter',
          'https://overpass.nchc.org.tw/api/interpreter',
        ];
        let data: { elements?: OverpassElement[] } | null = null;
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
              body: `data=${encodeURIComponent(query)}`,
              signal: controller.signal,
            });
            if (response.ok) {
              data = await response.json();
              break;
            }
          } catch (error) {
            if ((error as Error).name === 'AbortError') throw error;
          }
        }
        if (!data) throw new Error('Serviços indisponíveis');
        const elements = (data.elements || []) as OverpassElement[];
        const places: NearbyPlace[] = elements.flatMap((element) => {
          const latitudeValue = Number(element.lat ?? element.center?.lat);
          const longitudeValue = Number(element.lon ?? element.center?.lon);
          if (!Number.isFinite(latitudeValue) || !Number.isFinite(longitudeValue) || !element.tags?.name) return [];
          const category = selectedCategory === 'todas' ? inferCategory(element.tags) : selectedCategory;
          const street = [element.tags['addr:street'], element.tags['addr:housenumber']].filter(Boolean).join(', ');
          const address = [street, element.tags['addr:suburb'] || element.tags['addr:neighbourhood'], 'Cataguases - MG'].filter(Boolean).join(' — ');
          return [{
            id: `osm-${element.type}-${element.id}`,
            nome: element.tags.name,
            categoria: category,
            latitude: latitudeValue,
            longitude: longitudeValue,
            endereco: address,
          }];
        });
        setNearbyPlaces(places.slice(0, 500));
        setPlacesMessage(`${places.length} locais encontrados para ${CATEGORIES.find((item) => item.id === selectedCategory)?.label.toLowerCase() || 'a categoria selecionada'}.`);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setNearbyPlaces([]);
          setPlacesMessage('Não foi possível sincronizar os locais próximos agora.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingPlaces(false);
      }
    };
    void loadNearbyPlaces();
    return () => controller.abort();
  }, [placesSearchCenter, selectedCategory]);

  useEffect(() => {
    const cached = localStorage.getItem(ADDRESS_INDEX_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { savedAt: number; addresses: AddressSuggestion[] };
        if (Date.now() - parsed.savedAt < 7 * 24 * 60 * 60 * 1000 && parsed.addresses.length) {
          setCityAddressIndex(parsed.addresses);
          setIsLoadingAddressIndex(false);
          return;
        }
      } catch {
        localStorage.removeItem(ADDRESS_INDEX_CACHE_KEY);
      }
    }

    const controller = new AbortController();
    const loadAddressIndex = async () => {
      setIsLoadingAddressIndex(true);
      const query = '[out:json][timeout:60];area["boundary"="administrative"]["name"="Cataguases"]->.city;(way(area.city)["highway"]["name"];nwr(area.city)["addr:street"];nwr(area.city)["amenity"]["name"];nwr(area.city)["shop"]["name"];nwr(area.city)["tourism"]["name"];nwr(area.city)["leisure"]["name"];nwr(area.city)["office"]["name"];nwr(area.city)["craft"]["name"];nwr(area.city)["historic"]["name"];nwr(area.city)["natural"]["name"];nwr(area.city)["public_transport"]["name"];nwr(area.city)["place"~"suburb|neighbourhood|square"]["name"];nwr(area.city)["building"]["name"];);out center tags;';
      const endpoints = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://overpass.nchc.org.tw/api/interpreter',
      ];
      try {
        let payload: { elements?: OverpassElement[] } | null = null;
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
              body: `data=${encodeURIComponent(query)}`,
              signal: controller.signal,
            });
            if (response.ok) {
              payload = await response.json();
              break;
            }
          } catch (error) {
            if ((error as Error).name === 'AbortError') throw error;
          }
        }
        if (!payload) throw new Error('Índice indisponível');

        const addresses = (payload.elements || []).flatMap((element) => {
          const tags = element.tags || {};
          const isAddress = Boolean(tags['addr:street'] || tags.highway);
          const title = tags['addr:street'] || tags.name;
          if (!title) return [];
          const latitude = Number(element.lat ?? element.center?.lat);
          const longitude = Number(element.lon ?? element.center?.lon);
          const category = inferCategory(tags);
          const typeLabel = tags.shop ? 'Loja ou comércio'
            : tags.amenity ? 'Serviço ou equipamento urbano'
            : tags.tourism ? 'Turismo'
            : tags.leisure ? 'Lazer e espaço público'
            : tags.office ? 'Empresa ou escritório'
            : tags.public_transport || tags.highway === 'bus_stop' ? 'Transporte'
            : tags.place ? 'Bairro ou localidade'
            : tags.historic ? 'Patrimônio histórico'
            : tags.natural ? 'Área natural'
            : tags.building ? 'Edifício'
            : 'Logradouro';
          return [{
            cep: tags['addr:postcode'] || '',
            logradouro: title,
            complemento: tags['addr:housenumber'] || '',
            bairro: tags['addr:suburb'] || tags['addr:neighbourhood'] || '',
            localidade: 'Cataguases',
            uf: 'MG',
            kind: isAddress ? 'address' : 'place',
            latitude: Number.isFinite(latitude) ? latitude : undefined,
            longitude: Number.isFinite(longitude) ? longitude : undefined,
            category,
            typeLabel,
          } satisfies AddressSuggestion];
        });
        const unique = addresses.filter((address, index, items) => {
          const key = `${address.kind}|${address.logradouro}|${address.complemento}|${address.bairro}|${address.cep}`.toLowerCase();
          return items.findIndex((candidate) => `${candidate.kind}|${candidate.logradouro}|${candidate.complemento}|${candidate.bairro}|${candidate.cep}`.toLowerCase() === key) === index;
        }).sort((a, b) => a.logradouro.localeCompare(b.logradouro, 'pt-BR'));
        setCityAddressIndex(unique);
        localStorage.setItem(ADDRESS_INDEX_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), addresses: unique }));
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setAddressMessage('O índice urbano completo está temporariamente indisponível; a busca por endereços continua ativa.');
      } finally {
        if (!controller.signal.aborted) setIsLoadingAddressIndex(false);
      }
    };
    void loadAddressIndex();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (skipAddressLookupRef.current) {
      skipAddressLookupRef.current = false;
      return;
    }

    const normalizedQuery = normalizeSearchText(searchQuery);
    if (!normalizedQuery) {
      setAddressSuggestions([]);
      setAddressMessage('');
      return;
    }

    const localMatches = cityAddressIndex
      .filter((address) => normalizeSearchText(`${address.logradouro} ${address.complemento} ${address.bairro} ${address.cep} ${address.typeLabel || ''} ${address.localidade}`).includes(normalizedQuery))
      .sort((a, b) => {
        const aStarts = normalizeSearchText(a.logradouro).startsWith(normalizedQuery) ? 0 : 1;
        const bStarts = normalizeSearchText(b.logradouro).startsWith(normalizedQuery) ? 0 : 1;
        return aStarts - bStarts || a.logradouro.localeCompare(b.logradouro, 'pt-BR');
      });
    setAddressSuggestions(localMatches);
    setActiveSuggestion(-1);
    setAddressMessage(localMatches.length ? `${localMatches.length} locais correspondem ao texto digitado.` : 'Buscando em outras fontes…');

    const cepQuery = searchQuery.replace(/\D/g, '');
    const isCepQuery = cepQuery.length === 8;
    const streetQuery = searchQuery.replace(/\d+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!isCepQuery && normalizedQuery.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        const viaCepRequest = isCepQuery || streetQuery.length >= 3
          ? fetch(isCepQuery
            ? `https://viacep.com.br/ws/${cepQuery}/json/`
            : `https://viacep.com.br/ws/MG/Cataguases/${encodeURIComponent(streetQuery)}/json/`, { signal: controller.signal })
          : Promise.resolve(null);
        const photonRequest = fetch(`https://photon.komoot.io/api/?limit=50&lat=${CATAGUASES_CENTER[0]}&lon=${CATAGUASES_CENTER[1]}&q=${encodeURIComponent(`${searchQuery}, Cataguases, Minas Gerais`)}`, { signal: controller.signal });
        const [viaCepResult, photonResult] = await Promise.allSettled([viaCepRequest, photonRequest]);

        let viaCepSuggestions: AddressSuggestion[] = [];
        if (viaCepResult.status === 'fulfilled' && viaCepResult.value?.ok) {
          const rawData: AddressSuggestion[] | AddressSuggestion = await viaCepResult.value.json();
          viaCepSuggestions = (Array.isArray(rawData) ? rawData : [rawData]).filter(
            (item) => item.localidade?.toLowerCase() === 'cataguases' && item.uf === 'MG'
          ).map((item) => ({ ...item, kind: 'address' as const, typeLabel: 'Endereço' }));
        }

        let photonSuggestions: AddressSuggestion[] = [];
        if (photonResult.status === 'fulfilled' && photonResult.value.ok) {
          const photonData = await photonResult.value.json();
          photonSuggestions = ((photonData.features || []) as PhotonFeature[]).flatMap((feature) => {
            const properties = feature.properties || {};
            const coordinates = feature.geometry?.coordinates || [];
            const longitude = Number(coordinates[0]);
            const latitude = Number(coordinates[1]);
            const cityText = `${properties.city || ''} ${properties.county || ''}`.toLowerCase();
            const insideCity = latitude >= -21.47 && latitude <= -21.31 && longitude >= -42.78 && longitude <= -42.61;
            if (!properties.name || !Number.isFinite(latitude) || !Number.isFinite(longitude) || (!cityText.includes('cataguases') && !insideCity)) return [];
            const tags = properties.osm_key ? { [properties.osm_key]: properties.osm_value || 'yes' } : {};
            const category = inferCategory(tags);
            return [{
              cep: properties.postcode || '',
              logradouro: properties.name,
              complemento: properties.housenumber || '',
              bairro: properties.district || properties.locality || properties.street || '',
              localidade: 'Cataguases',
              uf: 'MG',
              kind: 'place' as const,
              latitude,
              longitude,
              category,
              typeLabel: CATEGORIES.find((item) => item.id === category)?.label || 'Local',
            }];
          });
        }

        const combined = [...photonSuggestions, ...localMatches, ...viaCepSuggestions].filter((item, index, items) => {
          if (!item.logradouro) return false;
          const key = `${item.logradouro}|${item.complemento}|${item.bairro}`.toLowerCase();
          return items.findIndex((candidate) => `${candidate.logradouro}|${candidate.complemento}|${candidate.bairro}`.toLowerCase() === key) === index;
        });
        setAddressSuggestions(combined);
        setActiveSuggestion(-1);
        setAddressMessage(combined.length ? `${combined.length} locais correspondem ao texto digitado.` : 'Nenhum endereço ou local encontrado em Cataguases.');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setAddressMessage('Não foi possível consultar os locais agora.');
      } finally {
        if (!controller.signal.aborted) setIsSearchingAddress(false);
      }
    }, 500);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [cityAddressIndex, searchQuery]);

  const toggleDisabilityFilter = (type: DisabilityType) => {
    setSelectedDisabilities((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('todas');
    setSelectedCity('Cataguases');
    setOnlyVerified(false);
    setSelectedDisabilities([]);
    setAddressSuggestions([]);
    setSearchedAddress(null);
    setAddressMessage('');
  };

  const disabilityKeys: DisabilityType[] = ['mobilidade', 'visual', 'auditiva', 'intelectual', 'invisivel'];
  const featuredCategories = CATEGORIES.filter((category) => category.id !== 'todas').slice(0, 5);

  const selectCategory = (category: EstablishmentCategory) => {
    setSelectedCategory(category);
    document.getElementById('search-filter-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const formatVerificationDate = (date?: string) => date
    ? new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(new Date(`${date}T12:00:00`))
    : null;
  const SelectedCategoryIcon = selectedCategory === 'todas' ? MapPin : categoryIcons[selectedCategory];

  const planRouteTo = async (establishment: Establishment) => {
    const requestId = ++routeRequestRef.current;
    setSuggestedRoute(null);
    setRouteStatus('locating');
    setRouteMessage('Obtendo sua localização…');

    if (!navigator.geolocation) {
      setRouteStatus('error');
      setRouteMessage('Seu navegador não oferece geolocalização.');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 60000,
        });
      });
      if (requestId !== routeRequestRef.current) return;

      setRouteStatus('routing');
      setRouteMessage('Calculando o melhor trajeto disponível…');
      const { latitude, longitude } = position.coords;
      const endpoint = `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${longitude},${latitude};${establishment.longitude},${establishment.latitude}?overview=full&geometries=geojson&steps=true`;
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Serviço de rotas indisponível');
      const data = await response.json();
      const result = data.routes?.[0];
      if (!result?.geometry?.coordinates?.length) throw new Error('Rota não encontrada');
      if (requestId !== routeRequestRef.current) return;

      const coordinates: [number, number][] = result.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );
      setSuggestedRoute({
        id: `suggested-${establishment.id}`,
        titulo: `Rota até ${establishment.nome}`,
        cidade: establishment.cidade,
        ponto_origem: 'Sua localização',
        ponto_destino: establishment.nome,
        trecho_descricao: 'Trajeto de pedestres sugerido pelo serviço de mapas.',
        tem_rampa: false,
        tem_piso_tatil: false,
        tem_semaforo_sonoro: false,
        nivel_seguranca: 'Trajeto ainda não auditado pela comunidade',
        coordenadas: coordinates,
        distancia_metros: Math.round(result.distance),
        duracao_segundos: Math.round(result.duration),
        auditada: false,
      });
      setRouteStatus('ready');
      setRouteMessage('Rota exibida no mapa.');
    } catch (error) {
      if (requestId !== routeRequestRef.current) return;
      setRouteStatus('error');
      const geolocationError = error as GeolocationPositionError;
      setRouteMessage(geolocationError?.code === 1
        ? 'Permita o acesso à localização para calcular a rota.'
        : 'Não foi possível calcular a rota agora. Tente novamente.');
    }
  };

  const handleMapSelection = (establishment: Establishment) => {
    setSearchedAddress(null);
    setSelectedEstablishment(establishment);
    void planRouteTo(establishment);
  };

  const selectAddress = async (suggestion: AddressSuggestion) => {
    const typedNumber = searchQuery.match(/\d+[A-Za-z]?/)?.[0] || suggestion.complemento;
    const displayAddress = `${suggestion.logradouro}${typedNumber ? `, ${typedNumber}` : ''} — ${suggestion.bairro || 'Cataguases'}, Cataguases - MG`;
    skipAddressLookupRef.current = true;
    setSearchQuery(displayAddress);
    setAddressSuggestions([]);
    setSelectedEstablishment(null);
    setSuggestedRoute(null);
    setRouteStatus('idle');
    setAddressMessage('Localizando o endereço no mapa…');

    try {
      if (suggestion.kind === 'place' && Number.isFinite(suggestion.latitude) && Number.isFinite(suggestion.longitude)) {
        setSearchedAddress({ latitude: suggestion.latitude!, longitude: suggestion.longitude!, label: displayAddress });
        setViewMode('map');
        setAddressMessage(`Local encontrado no mapa: ${displayAddress}`);
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      const query = `${suggestion.logradouro}${typedNumber ? `, ${typedNumber}` : ''}, ${suggestion.bairro}, Cataguases, Minas Gerais, Brasil`;
      const nominatimResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(query)}`);
      const nominatimData = nominatimResponse.ok ? await nominatimResponse.json() : [];
      let latitude = Number(nominatimData[0]?.lat);
      let longitude = Number(nominatimData[0]?.lon);
      const isInsideCataguases = (lat: number, lng: number) => lat >= -21.55 && lat <= -21.20 && lng >= -42.90 && lng <= -42.50;

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !isInsideCataguases(latitude, longitude)) {
        const photonResponse = await fetch(`https://photon.komoot.io/api/?limit=1&lat=-21.3924&lon=-42.6896&q=${encodeURIComponent(query)}`);
        const photonData = photonResponse.ok ? await photonResponse.json() : null;
        const coordinates = photonData?.features?.[0]?.geometry?.coordinates;
        longitude = Number(coordinates?.[0]);
        latitude = Number(coordinates?.[1]);
      }

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !isInsideCataguases(latitude, longitude)) throw new Error('Coordenadas não encontradas');
      setSearchedAddress({ latitude, longitude, label: displayAddress });
      setViewMode('map');
      setAddressMessage(`Endereço localizado no mapa: ${displayAddress}`);
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      setAddressMessage('O logradouro existe em Cataguases, mas não foi possível posicioná-lo com precisão no mapa. Confira o CEP e o número.');
    }
  };

  const handleAddressKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!addressSuggestions.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSuggestion((index) => Math.min(index + 1, addressSuggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSuggestion((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && activeSuggestion >= 0) {
      event.preventDefault();
      void selectAddress(addressSuggestions[activeSuggestion]);
    } else if (event.key === 'Escape') {
      setAddressSuggestions([]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-800">
      {/* Banner de Boas-Vindas Inclusivo */}
      <section aria-label="Apresentação da Plataforma" className="mb-6">
        <div className="bg-blue-950 text-white rounded-2xl px-6 py-8 sm:px-10 sm:py-10 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-300 mb-3">
              Informação confiável sobre acessibilidade
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Encontre lugares preparados para receber você
            </h1>
            <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed max-w-2xl">
              Consulte informações verificadas sobre mobilidade, comunicação, atendimento e conforto sensorial antes de sair de casa.
            </p>
            <a
              href="#search-filter-section"
              className="inline-flex items-center gap-2 mt-6 px-5 py-3 rounded-xl bg-white text-blue-950 text-sm font-bold hover:bg-blue-50 transition-colors"
            >
              Explorar locais
              <ChevronRight size={17} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section aria-labelledby="category-shortcuts-title" className="mb-6">
        <div className="flex items-end justify-between gap-4 mb-3">
          <div>
            <h2 id="category-shortcuts-title" className="text-lg font-bold text-slate-900">Encontre por categoria</h2>
            <p className="text-sm text-slate-500">Comece pelos lugares mais procurados.</p>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {featuredCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => selectCategory(category.id as EstablishmentCategory)}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-800 transition-colors"
            >
              {category.label}
            </button>
          ))}
        </div>
      </section>

      {/* Seção de Busca e Filtros */}
      <section
        id="search-filter-section"
        aria-label="Filtros e Busca de Estabelecimentos"
        className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 mb-6 space-y-5"
      >
        {/* Barra de Busca + Reconhecimento de Voz */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              id="main-search-input"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchedAddress(null); }}
              onKeyDown={handleAddressKeyDown}
              placeholder="Busque ruas, lojas, empresas, praças, serviços ou CEPs"
              role="combobox"
              aria-label="Buscar endereços, empresas, comércio, serviços e espaços públicos em Cataguases"
              aria-autocomplete="list"
              aria-expanded={addressSuggestions.length > 0}
              aria-controls="address-suggestions"
              aria-activedescendant={activeSuggestion >= 0 ? `address-option-${activeSuggestion}` : undefined}
              autoComplete="off"
              className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
            {(isSearchingAddress || isLoadingAddressIndex) && <LoaderCircle size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-700 animate-spin" aria-hidden="true" />}
            {addressSuggestions.length > 0 && (
              <ul id="address-suggestions" role="listbox" aria-label="Locais sugeridos em Cataguases" className="absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                {addressSuggestions.map((suggestion, index) => {
                  const SuggestionIcon = suggestion.kind === 'place' && suggestion.category
                    ? categoryIcons[suggestion.category]
                    : MapPin;
                  return (
                    <li key={`${suggestion.kind}-${suggestion.logradouro}-${suggestion.complemento}-${suggestion.bairro}-${suggestion.cep}`} id={`address-option-${index}`} role="option" aria-selected={activeSuggestion === index}>
                      <button type="button" onMouseEnter={() => setActiveSuggestion(index)} onClick={() => void selectAddress(suggestion)} className={`w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-left ${activeSuggestion === index ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700"><SuggestionIcon size={16} aria-hidden="true" /></span>
                        <span className="min-w-0">
                          <strong className="block text-sm text-slate-900">{suggestion.logradouro}{suggestion.complemento ? `, ${suggestion.complemento}` : ''}</strong>
                          <span className="block text-xs text-slate-500">{suggestion.typeLabel || 'Endereço'} · {suggestion.bairro || 'Cataguases'}{suggestion.cep ? ` · CEP ${suggestion.cep}` : ''}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <VoiceSearchButton
            onTranscript={(text) => setSearchQuery(text)}
            className="sm:w-auto w-full py-3.5 px-4"
          />
        </div>
        <p role="status" aria-live="polite" className="text-xs text-slate-500">
          {addressMessage || 'A busca inclui endereços, empresas, comércio, serviços e espaços públicos de Cataguases.'}
        </p>
        <p className="text-[11px] text-slate-400">Logradouros e CEPs: ViaCEP. Coordenadas e mapa: OpenStreetMap.</p>

        {/* Chips de Filtros Multi-Seleção por Deficiência */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <SlidersHorizontal size={14} className="text-blue-700" aria-hidden="true" />
              Recursos importantes para você
            </span>
            {selectedDisabilities.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedDisabilities([])}
                className="text-xs font-bold text-blue-700 hover:underline"
              >
                Limpar necessidades
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {disabilityKeys.map((type) => {
              const isSelected = selectedDisabilities.includes(type);
              return (
                <DisabilityBadge
                  key={type}
                  type={type}
                  size="md"
                  active={isSelected}
                  onClick={() => toggleDisabilityFilter(type)}
                />
              );
            })}
          </div>
        </div>

        {/* Filtros Secundários: Categoria, Cidade, Verificados */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label htmlFor="category-select" className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Categoria
            </label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as EstablishmentCategory | 'todas')}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-600"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="city-select" className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Cidade
            </label>
            <select
              id="city-select"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-600"
            >
              <option value="Cataguases">Cataguases (MG)</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2.5 p-2.5 w-full bg-slate-50 border border-slate-300 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-800">
                Somente locais verificados
              </span>
            </label>
          </div>
        </div>
      </section>

      {/* Barra de Status de Resultados e Alternador Mapa / Lista */}
      <div id="results-section" tabIndex={-1} className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div role="status" aria-live="polite" className="text-sm font-bold text-slate-700">
          {isLoading ? (
            <span>Carregando estabelecimentos...</span>
          ) : (
            <span>
              Mostrando <strong>{viewMode === 'map' ? nearbyPlaces.length : establishments.length}</strong>{' '}
              {viewMode === 'map' ? 'locais mapeados em Cataguases' : establishments.length === 1 ? 'local acessível' : 'locais acessíveis'}
              {searchQuery ? ` para "${searchQuery}"` : ''}
            </span>
          )}
        </div>

        {/* Alternador Obrigatório: Visual Mapa vs Lista Semântica */}
        <div
          role="radiogroup"
          aria-label="Modo de visualização"
          className="flex items-center bg-slate-200/80 p-1 rounded-2xl"
        >
          <button
            type="button"
            role="radio"
            aria-checked={viewMode === 'map'}
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'map'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Map size={16} aria-hidden="true" />
            <span>Mapa</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={viewMode === 'list'}
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List size={16} aria-hidden="true" />
            <span>Lista</span>
          </button>
        </div>
      </div>

      {viewMode === 'map' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4" aria-live="polite">
          <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs text-slate-600">
            <LocateFixed size={17} className="text-blue-700 shrink-0" aria-hidden="true" />
            <span><strong className="block text-slate-800">Localização em tempo real</strong>{locationMessage}</span>
          </div>
          <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs text-slate-600">
            {isLoadingPlaces ? <LoaderCircle size={17} className="text-blue-700 shrink-0 animate-spin" aria-hidden="true" /> : <SelectedCategoryIcon size={17} className="text-blue-700 shrink-0" aria-hidden="true" />}
            <span><strong className="block text-slate-800">Categoria exibida: {CATEGORIES.find((item) => item.id === selectedCategory)?.label}</strong>{placesMessage}</span>
          </div>
        </div>
      )}

      {/* Conteúdo Principal: Mapa ou Lista */}
      {loadError ? (
        <section role="alert" className="bg-white border border-rose-200 rounded-2xl px-6 py-10 text-center mb-12">
          <AlertCircle size={28} className="mx-auto text-rose-600 mb-3" aria-hidden="true" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Não foi possível carregar os locais</h2>
          <p className="text-sm text-slate-500 mb-5">Verifique sua conexão e tente novamente.</p>
          <button type="button" onClick={loadData} className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-bold transition-colors">
            Tentar novamente
          </button>
        </section>
      ) : isLoading ? (
        <section aria-label="Carregando resultados" aria-busy="true" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <div className="lg:col-span-2 h-[560px] rounded-2xl bg-slate-200 animate-pulse" />
          <div className="space-y-4">
            <div className="h-4 w-36 bg-slate-200 rounded animate-pulse" />
            <div className="h-72 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="h-36 bg-slate-200 rounded-xl animate-pulse" />
              <div className="h-5 w-2/3 bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-4/5 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
        </section>
      ) : establishments.length === 0 && viewMode === 'list' && !searchedAddress ? (
        <section className="bg-white rounded-2xl px-6 py-12 text-center border border-slate-200 mb-12">
          <Search size={28} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Nenhum local encontrado</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-5">Tente um termo mais amplo ou remova alguns filtros para ampliar os resultados.</p>
          <button type="button" onClick={handleResetFilters} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-bold transition-colors">
            <RotateCcw size={15} aria-hidden="true" />
            Limpar filtros
          </button>
        </section>
      ) : viewMode === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Mapa Leaflet */}
          <div className="lg:col-span-2">
            <MapLeaflet
              establishments={establishments}
              selectedEstablishment={selectedEstablishment}
              onSelectEstablishment={handleMapSelection}
              activeRoute={suggestedRoute}
              searchedAddress={searchedAddress}
              nearbyPlaces={nearbyPlaces}
              userLocation={userLocation}
              center={placesSearchCenter}
              zoom={14}
              heightClass="h-[440px] sm:h-[560px]"
            />
          </div>

          {/* Coluna Lateral de Estabelecimento em Destaque */}
          <div className="space-y-4">
            <div className="text-xs font-black text-slate-500 uppercase tracking-wider">
              {selectedEstablishment ? 'Local selecionado no mapa' : searchedAddress ? 'Endereço encontrado' : 'Pesquise um endereço em Cataguases'}
            </div>

            {selectedEstablishment ? (
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 animate-fadeIn">
                <div className="h-44 w-full rounded-2xl overflow-hidden bg-slate-100 relative">
                  <img
                    src={selectedEstablishment.fotos[0] || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800'}
                    alt={`Foto de ${selectedEstablishment.nome}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <VerifiedBadge status={selectedEstablishment.status} />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    {selectedEstablishment.categoria.replace('_', ' ')}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    {selectedEstablishment.nome}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin size={14} className="text-blue-600 shrink-0" />
                    <span>{selectedEstablishment.endereco} - {selectedEstablishment.cidade}</span>
                  </p>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3">
                  {selectedEstablishment.descricao}
                </p>

                {selectedEstablishment.verificado_em && (
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <CalendarDays size={14} aria-hidden="true" />
                    Verificado em {formatVerificationDate(selectedEstablishment.verificado_em)}
                  </p>
                )}

                <div aria-live="polite" className={`rounded-xl border px-3.5 py-3 text-xs ${routeStatus === 'error' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-blue-200 bg-blue-50 text-blue-950'}`}>
                  <div className="flex items-start gap-2">
                    {routeStatus === 'locating' || routeStatus === 'routing' ? (
                      <LoaderCircle size={16} className="mt-0.5 shrink-0 animate-spin" aria-hidden="true" />
                    ) : routeStatus === 'ready' ? (
                      <RouteIcon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <Navigation size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                    )}
                    <div className="flex-1">
                      <strong className="block text-sm">{routeStatus === 'ready' ? 'Rota sugerida' : 'Como chegar'}</strong>
                      <span className="block mt-0.5">{routeMessage || 'Selecione o local novamente para calcular uma rota.'}</span>
                      {suggestedRoute && (
                        <span className="block mt-1.5 font-bold">
                          {(suggestedRoute.distancia_metros / 1000).toFixed(1).replace('.', ',')} km · cerca de {Math.max(1, Math.round((suggestedRoute.duracao_segundos || 0) / 60))} min a pé
                        </span>
                      )}
                    </div>
                  </div>
                  {routeStatus === 'ready' && (
                    <p className="mt-2 border-t border-blue-200 pt-2 text-[11px] leading-relaxed">
                      {selectedDisabilities.includes('mobilidade')
                        ? 'O trajeto considera vias de pedestres, mas ainda não confirma rampas, inclinações ou obstáculos. Consulte os trechos auditados antes de sair.'
                        : 'Este trajeto ainda não foi auditado pela comunidade. Confirme as condições do percurso antes de sair.'}
                    </p>
                  )}
                  {routeStatus === 'error' && (
                    <button type="button" onClick={() => void planRouteTo(selectedEstablishment)} className="mt-2 font-bold underline underline-offset-2">Tentar novamente</button>
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(
                    new Set(
                      selectedEstablishment.criteria?.filter((c) => c.presente).map((c) => c.tipo_deficiencia) || []
                    )
                  ).map((t) => (
                    <DisabilityBadge key={t} type={t} size="sm" />
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <AudioReaderButton
                    textToRead={`${selectedEstablishment.nome}. ${selectedEstablishment.descricao}`}
                    label="Ouvir"
                    size="sm"
                  />
                  <button
                    type="button"
                    onClick={() => onSelectEstablishment(selectedEstablishment)}
                    className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Ver informações</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ) : searchedAddress ? (
              <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4 animate-fadeIn">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-800 grid place-items-center"><MapPin size={22} aria-hidden="true" /></div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Endereço localizado</h3>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{searchedAddress.label}</p>
                </div>
                <p className="text-xs text-slate-500">O marcador mostra a melhor coordenada disponível nas bases cartográficas consultadas.</p>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-3xl p-8 border border-dashed border-slate-300 text-center text-slate-500 text-sm">
                <MapPin size={32} className="mx-auto mb-2 text-slate-400" />
                <p className="font-semibold text-slate-700">Digite uma rua, avenida, bairro ou CEP</p>
                <p className="text-xs text-slate-500 mt-1">
                  As sugestões exibem apenas endereços registrados em Cataguases, Minas Gerais.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* MODO LISTA ACESSÍVEL (OTIMIZADO PARA LEITOR DE TELA) */
        <div className="space-y-4 mb-12">
          {establishments.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <p className="text-base font-bold text-slate-700 mb-2">
                Nenhum local atende a todos os critérios selecionados simultaneamente.
              </p>
              <p className="text-sm text-slate-500 mb-4">
                Tente desmarcar alguns filtros ou buscar por outro termo.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                <RotateCcw size={14} />
                <span>Restaurar todos os filtros</span>
              </button>
            </div>
          ) : (
            establishments.map((est) => {
              const supportedTypes = Array.from(
                new Set(est.criteria?.filter((c) => c.presente).map((c) => c.tipo_deficiencia) || [])
              );
              const cardSummary = `${est.nome}, ${est.categoria}, localizado em ${est.endereco}, ${est.cidade}. Nota ${est.nota_media} com ${est.total_avaliacoes} avaliações. ${est.descricao}`;

              return (
                <article
                  key={est.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-start justify-between"
                >
                  <div className="w-full md:w-56 h-44 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={est.fotos[0] || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800'}
                      alt={`Foto de ${est.nome}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md">
                        {est.categoria.replace('_', ' ')}
                      </span>
                      <VerifiedBadge status={est.status} />
                      <div className="flex items-center gap-1 text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md text-xs font-black">
                        <Star size={14} className="fill-amber-400 text-amber-500" aria-hidden="true" />
                        <span>{est.nota_media}</span>
                      </div>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 mb-1">
                      {est.nome}
                    </h2>

                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                      <MapPin size={14} className="text-blue-600 shrink-0" aria-hidden="true" />
                      <span>{est.endereco} - {est.bairro ? `${est.bairro}, ` : ''}{est.cidade} ({est.estado})</span>
                    </p>

                    <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                      {est.descricao}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mb-4">
                      <span>{est.total_avaliacoes} {est.total_avaliacoes === 1 ? 'avaliação' : 'avaliações'}</span>
                      {est.verificado_em && (
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={13} aria-hidden="true" />
                          Verificado em {formatVerificationDate(est.verificado_em)}
                        </span>
                      )}
                    </div>

                    {/* Badges de Deficiência Suportadas */}
                    <div className="flex flex-wrap gap-1.5">
                      {supportedTypes.map((t) => (
                        <DisabilityBadge key={t} type={t} size="sm" />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0">
                    <AudioReaderButton textToRead={cardSummary} label="Ouvir resumo" size="sm" />
                    <button
                      type="button"
                      onClick={() => onSelectEstablishment(est)}
                      className="px-5 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 focus:ring-2 focus:ring-blue-600"
                      aria-label={`Ver detalhes completos e critérios de acessibilidade de ${est.nome}`}
                    >
                      <span>Ver informações</span>
                      <ChevronRight size={14} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
