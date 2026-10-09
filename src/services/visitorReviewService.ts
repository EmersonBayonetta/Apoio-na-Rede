import { browserStorage, readStoredArray } from '../lib/browserStorage';
import { getSupabase } from '../lib/supabase';
import type { Review } from '../types';
const identityKey='apoio_review_visitor_v1';
const reviewedKey='apoio_reviewed_places_v1';
export function reviewVisitorId(): string {
 let id=browserStorage.getItem(identityKey);
 if(!id||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)){id=crypto.randomUUID();browserStorage.setItem(identityKey,id);}
 return id;
}
export const locallyReviewed=(placeId:string)=>readStoredArray<string>(reviewedKey).includes(placeId);
export function markReviewed(placeId:string){browserStorage.setItem(reviewedKey,JSON.stringify([...new Set([...readStoredArray<string>(reviewedKey),placeId])]));}
export async function mapPlaceReviews(placeId: string): Promise<Review[]> {
 const client = getSupabase();
 if (!client) return readStoredArray<Review>('acessacidade_reviews').filter(review => review.external_place_id === placeId);
 const { data, error } = await client.from('reviews').select('*').eq('external_place_id',placeId).eq('denunciada',false).order('data',{ascending:false});
 if (error) throw Error('Não foi possível carregar as avaliações deste local. Tente novamente.');
 return data as unknown as Review[];
}
export async function reviewRequest(details:Record<string,unknown>){
 let response: Response;
 try {
  response=await fetch('/api/review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...details,visitorId:reviewVisitorId()}),signal:AbortSignal.timeout(15000)});
 } catch {
  throw Error('Não foi possível confirmar o envio da avaliação. Confira sua conexão e tente novamente; se ela já foi recebida, o site impedirá um envio duplicado.');
 }
 if(!response.headers.get('content-type')?.includes('application/json'))throw Error('Avaliações indisponíveis neste ambiente.');
 const result=await response.json();
 if(!response.ok){if(response.status===409)markReviewed(String(details.establishment_id));throw Error(result.error||'Não foi possível enviar a avaliação.');}
 return result;
}
