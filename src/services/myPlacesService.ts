import { getSupabase } from '../lib/supabase';
import { validateRegistration } from '../utils/registrationValidation';
import { ManagementError, type ManagedPlace, type PlaceEdit } from './placeManagementService';

export type ChangeRequest = {
  id: string;
  status: 'pendente' | 'verificado' | 'rejeitado';
  motivo_rejeicao?: string | null;
  criado_em: string;
  decidido_em?: string | null;
};
export type OwnedPlace = ManagedPlace & { change_request: ChangeRequest | null };

async function request<T>(method: 'GET' | 'POST', body?: unknown): Promise<T> {
  const client = getSupabase();
  const {data,error} = await client!.auth.getSession();
  let session = data.session;
  // A screen can mount immediately after login. Refreshing a token that is about
  // to expire prevents a stale access token from reaching the protected route.
  if (!error && session?.expires_at && session.expires_at * 1000 < Date.now() + 30_000) {
    const refreshed = await client!.auth.refreshSession();
    session = refreshed.data.session;
  }
  if (error || !session) throw new ManagementError('Entre para acessar seus locais.',401);
  const response = await fetch('/api/my-places', {method, headers:{Authorization:`Bearer ${session.access_token}`,...(body ? {'Content-Type':'application/json'} : {})}, ...(body ? {body:JSON.stringify(body)} : {})});
  if (!response.headers.get('content-type')?.includes('application/json')) throw Error('Use o site publicado para acessar seus locais online.');
  const result = await response.json();
  if (!response.ok) throw new ManagementError(result.error || 'Não foi possível concluir a operação.',response.status);
  return result as T;
}

export const MyPlacesService = {
  async list() {
    if (!getSupabase()) throw new ManagementError('O acesso aos seus locais precisa da conexão com a conta.',503);
    return (await request<{places:OwnedPlace[]}>('GET')).places;
  },
  async requestChange(place: OwnedPlace, details: PlaceEdit) {
    validateRegistration({...details,fotos:details.fotos.filter(photo => !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(photo))});
    if (details.fotos.length > 10 || details.fotos.some(photo => photo.length > (photo.startsWith('data:') ? 280000 : 2000))) throw Error('Envie até 10 fotos válidas.');
    await request('POST',{id:place.id,expectedUpdatedAt:place.atualizado_em,details});
    return place;
  },
};
