import { browserStorage, readStoredArray } from '../lib/browserStorage';
const identityKey='apoio_review_visitor_v1';
const reviewedKey='apoio_reviewed_places_v1';
export function reviewVisitorId(): string {
 let id=browserStorage.getItem(identityKey);
 if(!id||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)){id=crypto.randomUUID();browserStorage.setItem(identityKey,id);}
 return id;
}
export const locallyReviewed=(placeId:string)=>readStoredArray<string>(reviewedKey).includes(placeId);
export function markReviewed(placeId:string){browserStorage.setItem(reviewedKey,JSON.stringify([...new Set([...readStoredArray<string>(reviewedKey),placeId])]));}
export async function reviewRequest(details:Record<string,unknown>){
 const response=await fetch('/api/review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...details,visitorId:reviewVisitorId()})});
 if(!response.headers.get('content-type')?.includes('application/json'))throw Error('Avaliações indisponíveis neste ambiente.');
 const result=await response.json();
 if(!response.ok){if(response.status===409)markReviewed(String(details.establishment_id));throw Error(result.error||'Não foi possível enviar a avaliação.');}
 return result;
}
