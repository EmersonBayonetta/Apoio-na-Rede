import { useState } from 'react';
import { MAP_CATEGORIES } from '../../data/mapCategories';
import { readLocalPhoto } from '../../utils/localPhoto';
import { imageFallback } from '../../utils/imageFallback';
import { registrationTextSchema, validPhotoUrl } from '../../utils/registrationValidation';
import { locateAddress } from '../../services/addressService';
import { ManagementError, PlaceManagementService, type ManagedPlace, type PlaceEdit } from '../../services/placeManagementService';

const fieldClass = 'w-full rounded-xl border border-slate-300 bg-white p-3 text-sm';
const textFields = [
  ['nome','Nome do local',true], ['endereco','Rua e número',true], ['bairro','Bairro',false],
  ['cidade','Cidade',true], ['estado','UF',true], ['cep','CEP',false],
  ['telefone','Telefone com DDD',false], ['whatsapp','WhatsApp com DDD',false],
  ['horario_funcionamento','Horário de funcionamento',false],
] as const;
const statusLabels = {pendente:'Pendente de revisão',verificado:'Publicado',rejeitado:'Recusado'};

export function PlaceEditForm({place,onSaved,onCancel,onSessionExpired}: {place:ManagedPlace;onSaved:(place:ManagedPlace) => void;onCancel:() => void;onSessionExpired:() => void}) {
  const [details,setDetails] = useState<PlaceEdit>(() => ({
    nome:place.nome,categoria:place.categoria,descricao:place.descricao ?? '',endereco:place.endereco,
    bairro:place.bairro ?? '',cidade:place.cidade,estado:place.estado,cep:place.cep ?? '',
    telefone:place.telefone ?? '',whatsapp:place.whatsapp ?? '',horario_funcionamento:place.horario_funcionamento ?? '',
    latitude:place.latitude,longitude:place.longitude,fotos:place.fotos ?? [],
  }));
  const [latitude,setLatitude] = useState(String(place.latitude));
  const [longitude,setLongitude] = useState(String(place.longitude));
  const [locationConfirmed,setLocationConfirmed] = useState(true);
  const [photoUrl,setPhotoUrl] = useState('');
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');
  const [conflict,setConflict] = useState(false);
  const update = <K extends keyof PlaceEdit>(key:K,value:PlaceEdit[K]) => setDetails(previous => ({...previous,[key]:value}));
  const addFile = async (event:React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || busy) return;
    setBusy(true);setMessage('Preparando imagem…');
    try { const photo = await readLocalPhoto(file);setDetails(previous => ({...previous,fotos:[...previous.fotos,photo].slice(0,10)}));setMessage(''); }
    catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  };
  const locate = async () => {
    setBusy(true);setMessage('Localizando endereço…');
    try {
      const point = await locateAddress([details.endereco,details.bairro,`${details.cidade} - ${details.estado}`,details.cep].filter(Boolean).join(', '));
      setLatitude(String(point.latitude));setLongitude(String(point.longitude));setLocationConfirmed(true);
      setMessage('Ponto localizado. Confira a posição no mapa antes de salvar.');
    } catch { setMessage('Não foi possível localizar. Confira o endereço ou informe e confirme as coordenadas manualmente.'); }
    finally { setBusy(false); }
  };
  const save = async (event:React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!locationConfirmed) { setMessage('Confirme as coordenadas após alterar o endereço ou o ponto no mapa.');document.getElementById('edit-latitude')?.focus();return; }
    if (photoUrl.trim()) { setMessage('Clique em Adicionar link para incluir a foto, ou limpe o campo antes de salvar.');document.getElementById('edit-photo-url')?.focus();return; }
    setBusy(true);setMessage('Salvando alterações…');
    try {
      const saved = await PlaceManagementService.save(place,{...details,estado:details.estado.toUpperCase(),latitude:Number(latitude.replace(',','.')),longitude:Number(longitude.replace(',','.'))});
      onSaved(saved);
    } catch (error) {
      if (error instanceof ManagementError && [401,403].includes(error.status)) { onSessionExpired();return; }
      setConflict(error instanceof ManagementError && error.status === 409);setMessage((error as Error).message);
    } finally { setBusy(false); }
  };
  return <form onSubmit={event => void save(event)} className="space-y-6 rounded-2xl border bg-white p-4 sm:p-6">
    <div><h2 className="text-xl font-bold">Editar {place.nome}</h2><p className="mt-2 text-sm text-slate-600">{statusLabels[place.status]}. {place.status === 'verificado' ? 'As alterações ficarão visíveis no site após salvar.' : 'Salvar mantém o status atual do cadastro.'}</p></div>
    <fieldset disabled={busy} className="space-y-6 disabled:opacity-60">
      <legend className="sr-only">Dados do local</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {textFields.map(([key,label,required]) => <label key={key} className="grid gap-2 text-sm font-semibold">{label}{required ? ' *' : ''}<input id={`edit-${key}`} value={details[key]} required={required} minLength={key === 'nome' || key === 'cidade' || key === 'endereco' ? registrationTextSchema[key].min : undefined} maxLength={key === 'estado' ? 2 : key === 'cep' ? 9 : 5000} type={key === 'telefone' || key === 'whatsapp' ? 'tel' : 'text'} onChange={event => {
          update(key,event.target.value);
          if (['endereco','bairro','cidade','estado','cep'].includes(key)) setLocationConfirmed(false);
        }} className={fieldClass} />{(key === 'nome' || key === 'cidade' || key === 'endereco') && <span className="text-xs font-normal text-slate-600">Mínimo de {registrationTextSchema[key].min} caracteres, sem contar espaços nas pontas.</span>}</label>)}
        <label className="grid gap-2 text-sm font-semibold">Categoria *<select value={details.categoria} onChange={event => update('categoria',event.target.value as PlaceEdit['categoria'])} className={fieldClass}>{Object.entries(MAP_CATEGORIES).map(([value,category]) => <option key={value} value={value}>{category.label}</option>)}</select></label>
      </div>
      <label className="grid gap-2 text-sm font-semibold">Descrição *<textarea required minLength={registrationTextSchema.descricao.min} maxLength={registrationTextSchema.descricao.max} aria-describedby="edit-description-help" rows={4} value={details.descricao} onChange={event => update('descricao',event.target.value)} className={fieldClass} /><span id="edit-description-help" className="text-xs font-normal text-slate-600">Mínimo de {registrationTextSchema.descricao.min} caracteres. {details.descricao.trim().length} caracteres preenchidos.</span></label>
      <section className="space-y-3 rounded-xl border p-4" aria-labelledby="edit-map-heading">
        <h3 id="edit-map-heading" className="font-bold">Ponto no mapa</h3>
        <p className="text-sm text-slate-600">Ao mudar o endereço, localize novamente ou confirme as coordenadas corretas.</p>
        <button type="button" onClick={() => void locate()} className="rounded-xl border px-4 py-3 font-semibold">Localizar endereço</button>
        <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm">Latitude<input id="edit-latitude" required inputMode="decimal" value={latitude} onChange={event => {setLatitude(event.target.value);setLocationConfirmed(false);}} className={fieldClass} /></label><label className="grid gap-2 text-sm">Longitude<input required inputMode="decimal" value={longitude} onChange={event => {setLongitude(event.target.value);setLocationConfirmed(false);}} className={fieldClass} /></label></div>
        <button type="button" onClick={() => {const lat=Number(latitude.replace(',','.')),lng=Number(longitude.replace(',','.'));if (!latitude.trim() || !longitude.trim() || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat)>90 || Math.abs(lng)>180) {setMessage('Informe coordenadas válidas.');return;}setLocationConfirmed(true);setMessage('Coordenadas confirmadas.');}} className="rounded-xl border px-4 py-3 font-semibold">Confirmar coordenadas</button>
        {locationConfirmed && <a href={`https://www.google.com/maps/search/?api=1&query=${Number(latitude.replace(',','.'))},${Number(longitude.replace(',','.'))}`} target="_blank" rel="noopener noreferrer" className="ml-3 inline-block py-3 text-sm underline">Conferir no mapa<span className="sr-only"> (abre em nova aba)</span></a>}
      </section>
      <section aria-labelledby="edit-photos-heading" className="space-y-3">
        <h3 id="edit-photos-heading" className="font-bold">Fotos ({details.fotos.length}/10)</h3>
        <p className="text-sm text-slate-600">A primeira foto será a capa do local.</p>
        <label htmlFor="edit-photo-url" className="block text-sm font-semibold">Link da imagem</label>
        <div className="flex flex-col gap-2 sm:flex-row"><input id="edit-photo-url" type="url" value={photoUrl} onChange={event => setPhotoUrl(event.target.value)} placeholder="https://exemplo.com/foto.jpg" className={fieldClass} /><button type="button" disabled={details.fotos.length >= 10} onClick={() => {
          if (!validPhotoUrl(photoUrl.trim()) || photoUrl.trim().length > 2000) {setMessage('Informe um link HTTP ou HTTPS válido para a foto.');return;}
          update('fotos',[...details.fotos,photoUrl.trim()]);setPhotoUrl('');setMessage('');
        }} className="shrink-0 rounded-xl border px-4 py-3 font-semibold disabled:opacity-50">Adicionar link</button></div>
        <label htmlFor="edit-photo-file" className="block text-sm font-semibold">Carregar imagem do computador ou celular</label>
        <input id="edit-photo-file" type="file" accept="image/jpeg,image/png,image/webp" disabled={details.fotos.length >= 10} onChange={event => void addFile(event)} aria-describedby="edit-photo-help" className={fieldClass} />
        <p id="edit-photo-help" className="text-xs text-slate-600">JPG, PNG ou WebP de até 10 MB. As imagens são reduzidas para envio.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{details.fotos.map((photo,index) => <div key={`${photo}-${index}`} className="overflow-hidden rounded-xl border">
          <img src={photo} alt={index === 0 ? 'Foto de capa do local' : `Foto ${index+1} do local`} onError={imageFallback} className="h-40 w-full object-cover" />
          <div className="flex flex-wrap items-center gap-2 p-2 text-xs">{index === 0 ? <span className="font-bold">Capa</span> : <button type="button" onClick={() => update('fotos',[photo,...details.fotos.filter((_,i) => i !== index)])} className="rounded-lg border px-3 py-2">Usar como capa</button>}<button type="button" aria-label={`Remover foto ${index+1}`} onClick={() => update('fotos',details.fotos.filter((_,i) => i !== index))} className="rounded-lg border px-3 py-2 text-rose-700">Remover</button></div>
        </div>)}</div>
      </section>
    </fieldset>
    {message && <p role="status" className="rounded-xl border bg-blue-50 p-4 text-sm text-blue-950">{message}</p>}
    <div className="flex flex-wrap gap-3"><button type="submit" disabled={busy || conflict} className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? 'Aguarde…' : 'Salvar alterações'}</button><button type="button" disabled={busy} onClick={onCancel} className="rounded-xl border px-5 py-3 font-semibold">Voltar à lista</button></div>
    {conflict && <p className="text-sm">Volte à lista e abra o local novamente para carregar a versão atual.</p>}
  </form>;
}
