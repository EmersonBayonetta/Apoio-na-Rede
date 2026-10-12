import { getSupabase } from '../lib/supabase';
import { browserStorage, readStoredArray } from '../lib/browserStorage';
import { normalizeSearchText } from '../utils/normalizeSearchText';
import { validateRegistration } from '../utils/registrationValidation';
import type { EstablishmentCategory, EstablishmentStatus } from '../types';

export interface PlaceEdit {
  nome: string; categoria: EstablishmentCategory; descricao: string;
  endereco: string; bairro: string; cidade: string; estado: string; cep: string;
  latitude: number; longitude: number; telefone: string; whatsapp: string;
  horario_funcionamento: string; fotos: string[];
}
export interface ManagedPlace extends PlaceEdit {
  id: string; status: EstablishmentStatus; atualizado_em: string | null;
}
export class ManagementError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
const storageKey = 'acessacidade_establishments';
const localPlaces = () => {
  let places = readStoredArray<ManagedPlace>(storageKey);
  // Compare with persistent data so an edit in another tab cannot be overwritten.
  if (!browserStorage.isTemporary()) {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (Array.isArray(stored)) places = stored as ManagedPlace[];
    } catch { /* Retain the session fallback when browser storage is unavailable. */ }
  }
  return places.map(place => ({...place,atualizado_em:place.atualizado_em ?? null}));
};

async function request<T>(query: string, body?: unknown): Promise<T> {
  const client = getSupabase();
  const {data,error} = await client!.auth.getSession();
  if (error || !data.session) throw new ManagementError('Entre com o e-mail do administrador.',401);
  const response = await fetch(`/api/manage-places${query}`,{
    method:body ? 'PATCH' : 'GET',
    headers:{Authorization:`Bearer ${data.session.access_token}`,...(body ? {'Content-Type':'application/json'} : {})},
    ...(body ? {body:JSON.stringify(body)} : {}),
  });
  if (!response.headers.get('content-type')?.includes('application/json')) throw Error('Use o site publicado para gerenciar os dados online. O Vite local não executa as funções de gestão.');
  const result = await response.json();
  if (!response.ok) throw new ManagementError(result.error || 'Não foi possível acessar os locais.',response.status);
  return result as T;
}

export const PlaceManagementService = {
  async list(search: string, status: EstablishmentStatus | '', page: number) {
    if (!getSupabase()) {
      const places = localPlaces().filter(place => normalizeSearchText(place.nome).includes(normalizeSearchText(search)) && (!status || place.status === status)).sort((a,b) => a.nome.localeCompare(b.nome,'pt-BR'));
      return {places:places.slice(page * 20,page * 20 + 20),total:places.length};
    }
    return request<{places:ManagedPlace[];total:number}>(`?${new URLSearchParams({q:search,status,page:String(page)})}`);
  },
  async get(id: string) {
    if (!getSupabase()) {
      const place = localPlaces().find(place => place.id === id);
      if (!place) throw Error('Local não encontrado.');
      return place;
    }
    return (await request<{place:ManagedPlace}>(`?${new URLSearchParams({id})}`)).place;
  },
  async save(place: ManagedPlace, details: PlaceEdit) {
    validateRegistration({...details,fotos:details.fotos.filter(photo => !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(photo))});
    if (details.fotos.length > 10 || details.fotos.some(photo => photo.length > (photo.startsWith('data:') ? 280000 : 2000))) throw Error('Envie até 10 fotos válidas.');
    if (getSupabase()) return (await request<{place:ManagedPlace}>('',{id:place.id,expectedUpdatedAt:place.atualizado_em,details})).place;
    const places = localPlaces();
    const current = places.find(item => item.id === place.id);
    if (!current) throw Error('Local não encontrado.');
    if (current.atualizado_em !== place.atualizado_em) throw new ManagementError('Este local foi alterado. Recarregue o cadastro antes de salvar.',409);
    const saved = {...current,...details,atualizado_em:new Date().toISOString()};
    browserStorage.setItem(storageKey,JSON.stringify(places.map(item => item.id === place.id ? saved : item)));
    return saved;
  },
};
