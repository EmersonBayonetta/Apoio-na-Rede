import { getSupabase } from '../lib/supabase';
import { browserStorage, readStoredArray } from '../lib/browserStorage';
import { ACCESSIBILITY_RESOURCES } from '../data/accessibilityResources';
import type { Establishment } from '../types';
import type { Json } from '../types/database';

export type Answers = Record<string, 'sim' | 'nao' | 'nao_sei'>;
export interface PlaceReport {
  id: string; establishment_id?: string | null; place_id?: string | null; local_key?: string | null;
  respostas: Answers; comentario: string; fotos: string[];
  status: 'pendente' | 'aprovado' | 'recusado'; motivo_recusa?: string | null; criado_em: string;
}
const REPORTS = 'apoio_reports_v1';
export const PUBLIC_PLACE_COLUMNS = 'id,place_id,nome,categoria,endereco,bairro,cidade,estado,cep,latitude,longitude,descricao,fotos,status,telefone,whatsapp,email_contato,horario_funcionamento,website,nota_media,total_avaliacoes,verificado_em,criado_em,informado_responsavel';
export const emptyAnswers = (): Answers => Object.fromEntries(ACCESSIBILITY_RESOURCES.map(r => [r.id, 'nao_sei']));
export const localKey = (place: Pick<Establishment, 'id' | 'place_id'>) => place.place_id || place.id;

export async function requireUser() {
  const client = getSupabase();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error('Entre com seu e-mail para contribuir.');
  return data.user;
}

export async function requireAdministrator() {
  const client = getSupabase();
  if (!client) return;
  await requireUser();
  const {data,error} = await client.rpc('is_site_admin');
  if (error || data !== true) throw new Error('Acesso não autorizado');
}

export { confirmedCriteria } from '../utils/communityConfirmation';

export const ContributionService = {
  async own(place: Pick<Establishment, 'id' | 'place_id'>): Promise<PlaceReport | null> {
    const client = getSupabase();
    if (!client) return readStoredArray<PlaceReport>(REPORTS).find(r => r.local_key === localKey(place)) ?? null;
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) return null;
    const { data, error } = await client.from('place_reports').select('*').eq('local_key', localKey(place)).eq('user_id', auth.user.id).maybeSingle();
    if (error) throw new Error('Não foi possível consultar seu relato.');
    return data as PlaceReport | null;
  },
  async approved(key: string): Promise<PlaceReport[]> {
    const client = getSupabase();
    if (!client) return readStoredArray<PlaceReport>(REPORTS).filter(r => r.local_key === key && r.status === 'aprovado');
    const { data, error } = await client.rpc('get_approved_reports', { requested_key: key });
    if (error) throw new Error('Não foi possível consultar os relatos aprovados.');
    return data as unknown as PlaceReport[];
  },
  async send(place: Pick<Establishment, 'id' | 'place_id'>, respostas: Answers, comentario: string, files: File[]) {
    if (files.length > 3) throw new Error('Envie no máximo 3 fotos.');
    if (files.some(f => !['image/jpeg','image/png','image/webp'].includes(f.type) || f.size > 5 * 1024 * 1024)) throw new Error('Use imagens JPG, PNG ou WebP de até 5 MB.');
    if (comentario.length > 2000) throw new Error('O comentário deve ter até 2.000 caracteres.');
    if (await this.own(place)) throw new Error('Você já relatou este local.');
    const client = getSupabase();
    const fotos: string[] = [];
    if (!client) {
      const reports = readStoredArray<PlaceReport>(REPORTS);
      if (reports.filter(r => Date.parse(r.criado_em) > Date.now() - 86400000).length >= 10) throw new Error('Limite de 10 relatos em 24 horas atingido.');
      for (const file of files) fotos.push(await new Promise<string>((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file);
      }));
      const report: PlaceReport = { id: crypto.randomUUID(), local_key: localKey(place), establishment_id: place.id, place_id: place.place_id, respostas, comentario, fotos, status: 'pendente', criado_em: new Date().toISOString() };
      // Recheck after reading files, which yields to other submissions in this page.
      const latest = readStoredArray<PlaceReport>(REPORTS);
      if (latest.some(r => r.local_key === report.local_key)) throw new Error('Você já relatou este local.');
      browserStorage.setItem(REPORTS, JSON.stringify([...latest, report]));
      return;
    }
    const user = await requireUser();
    try {
      for (const file of files) {
        const path = `${user!.id}/${localKey(place)}/${crypto.randomUUID()}.${file.type.split('/')[1]}`;
        const { error } = await client.storage.from('report-photos').upload(path, file, { upsert: false, contentType: file.type });
        if (error) throw new Error('Não foi possível enviar a foto.');
        fotos.push(path);
      }
      const registered = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(place.id);
      const { error } = await client.from('place_reports').insert({ establishment_id: registered ? place.id : null, place_id: place.place_id || null, respostas: respostas as Json, comentario, fotos });
      if (error) throw new Error(error.code === '23505' ? 'Você já relatou este local.' : error.message);
    } catch (error) {
      if (fotos.length) await client.storage.from('report-photos').remove(fotos);
      throw error;
    }
  },
  async photoUrl(path: string) {
    const client = getSupabase();
    if (!client) return path;
    const { data, error } = await client.storage.from('report-photos').createSignedUrl(path, 300);
    if (error) throw new Error('Foto indisponível.');
    return data.signedUrl;
  },
  async pending() {
    const client = getSupabase();
    if (!client) return { reports: readStoredArray<PlaceReport>(REPORTS).filter(r => r.status === 'pendente'), places: readStoredArray<Establishment>('acessacidade_establishments').filter(e => e.status === 'pendente') };
    await requireAdministrator();
    const [reports, places] = await Promise.all([client.from('place_reports').select('*').eq('status','pendente'), client.from('establishments').select('*').eq('status','pendente')]);
    if (reports.error || places.error) throw new Error('Não foi possível carregar a moderação.');
    return { reports: reports.data as PlaceReport[], places: places.data as Establishment[] };
  },
  async moderate(kind: 'report' | 'place', id: string, approve: boolean, reason: string) {
    if (!approve && !reason.trim()) throw new Error('Informe o motivo da recusa.');
    const client = getSupabase();
    if (client) {
      await requireAdministrator();
      const result = kind === 'report'
        ? await client.from('place_reports').update({ status: approve ? 'aprovado' : 'recusado', motivo_recusa: approve ? null : reason }).eq('id',id).eq('status','pendente')
        : await client.from('establishments').update({ status: approve ? 'verificado' : 'rejeitado', motivo_rejeicao: approve ? null : reason, verificado_em: approve ? new Date().toISOString() : null }).eq('id',id).eq('status','pendente');
      if (result.error) throw new Error(result.error.message);
    } else if (kind === 'report') {
      browserStorage.setItem(REPORTS, JSON.stringify(readStoredArray<PlaceReport>(REPORTS).map(r => r.id === id ? { ...r, status: approve ? 'aprovado' : 'recusado', motivo_recusa: reason } : r)));
    } else {
      const key = 'acessacidade_establishments';
      browserStorage.setItem(key, JSON.stringify(readStoredArray<Establishment>(key).map(e => e.id === id ? { ...e, status: approve ? 'verificado' : 'rejeitado', verificado_em: approve ? new Date().toISOString() : undefined, motivo_rejeicao: reason } : e)));
    }
  },
};
