import { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';
import type { Establishment } from '../types';

type Registration = Pick<Establishment,'id'|'nome'|'endereco'|'cidade'|'estado'|'descricao'|'telefone'|'whatsapp'|'horario_funcionamento'|'fotos'|'status'|'motivo_rejeicao'> & {kind?:string;especialidade?:string;registro_profissional?:string;atende_por_tipo?:string[];email?:string;criteria:{criterio:string;presente:boolean|null;observacao_livre?:string}[]};

export function RegistrationReviewView() {
  const [registration,setRegistration]=useState<Registration|null>(null);
  const [message,setMessage]=useState('Conferindo seu acesso…');
  const [reason,setReason]=useState('');
  const [busy,setBusy]=useState(false);
  const [revision,setRevision]=useState(0);
  const id=new URLSearchParams(window.location.search).get('cadastro');
  const directory=['routes','professionals'].includes(new URLSearchParams(window.location.search).get('tipo')||'');
  useEffect(()=>{
    const client=getSupabase();
    const listener=client?.auth.onAuthStateChange(()=>setRevision(value=>value+1));
    document.title='Revisar cadastro — Apoio na Rede';
    const meta=document.createElement('meta');meta.name='robots';meta.content='noindex';document.head.append(meta);
    return ()=>{listener?.data.subscription.unsubscribe();meta.remove();};
  },[]);
  useEffect(()=>{
    let active=true;
    const load=async()=>{
      const client=getSupabase();
      if(!client||!id||!/^[0-9a-f-]{36}$/i.test(id)){if(active)setMessage('Link de revisão inválido.');return;}
      const {data:{user}}=await client.auth.getUser();
      if(!user){if(active){setRegistration(null);setMessage('Abra o link de acesso enviado pelo Supabase ao e-mail do responsável pelo site.');}return;}
      const {data,error}=await client.rpc(directory?'directory_for_review':'registration_for_review',{registration_id:id});
      if(!active)return;
      if(error||!data){setRegistration(null);setMessage('Este cadastro só pode ser revisado pelo titular autorizado, ou não está disponível.');return;}
      setRegistration(data as Registration);setMessage('');
    };
    void load().catch(()=>{if(active)setMessage('Não foi possível carregar o cadastro. Tente novamente mais tarde.');});
    return ()=>{active=false;};
  },[id,revision,directory]);
  const decide=async(approve:boolean)=>{
    if(busy||!registration)return;
    if(!approve&&!reason.trim()){setMessage('Informe o motivo da recusa.');return;}
    setBusy(true);
    try {
      const client=getSupabase();if(!client)throw Error();
      const {error}=await client.rpc(directory?'decide_directory':'decide_registration',{registration_id:registration.id,approve,reason});
      if(error)throw error;
      setRegistration(previous=>previous?{...previous,status:approve?'verificado':'rejeitado'}:null);
      setMessage(approve?'Cadastro aprovado e publicado.':'Cadastro recusado.');
    }catch{setMessage('Não foi possível concluir a revisão. Confira seu acesso e tente novamente.');}
    finally{setBusy(false);}
  };
  return <main className="mx-auto max-w-3xl p-6 text-slate-900">
    <h1 className="mb-6 text-3xl font-bold">Revisar cadastro</h1>
    {message&&<p role="status" className="mb-4 rounded-xl border p-4">{message}</p>}
    {registration&&<article className="space-y-4 rounded-2xl border bg-white p-5">
      <h2 className="text-2xl font-bold">{registration.nome}</h2>
      <p>{registration.endereco} · {registration.cidade} – {registration.estado}</p>
      <p className="whitespace-pre-wrap">{registration.descricao}</p>
      {registration.especialidade&&<p>Especialidade: {registration.especialidade} · Registro: {registration.registro_profissional||'Não informado'}</p>}
      {registration.atende_por_tipo&&<p>Necessidades atendidas informadas: {registration.atende_por_tipo.join(', ')||'Não informadas'}</p>}
      {registration.email&&<p>E-mail profissional: {registration.email}</p>}
      <p>Telefone: {registration.telefone||'Não informado'} · WhatsApp: {registration.whatsapp||'Não informado'}</p>
      <p>Horário: {registration.horario_funcionamento||'Não informado'}</p>
      <h3 className="font-bold">Recursos informados</h3>
      <ul className="space-y-2">{registration.criteria.map((c,index)=><li key={index}>{c.criterio}: <strong>{c.presente===true?'Sim':c.presente===false?'Não':'Não informado'}</strong>{c.observacao_livre&&<p className="text-sm">{c.observacao_livre}</p>}</li>)}</ul>
      {registration.fotos.length>0&&<div className="grid gap-3 sm:grid-cols-2">{registration.fotos.map((url,index)=><img key={index} src={url} alt={`Foto ${index+1} enviada para revisão`} className="h-48 w-full rounded-xl object-cover" />)}</div>}
      {registration.status==='pendente'?<>
        <label className="grid gap-2">Motivo, caso recuse<textarea value={reason} onChange={e=>setReason(e.target.value)} maxLength={1000} className="rounded-xl border bg-white p-3" /></label>
        <div className="flex flex-wrap gap-3"><button disabled={busy} onClick={()=>void decide(true)} className="min-h-11 rounded-xl bg-blue-700 px-4 font-bold text-white">Aprovar e publicar</button><button disabled={busy} onClick={()=>void decide(false)} className="min-h-11 rounded-xl border px-4 font-bold">Recusar cadastro</button></div>
      </>:<p>Este cadastro já foi revisado: {registration.status==='verificado'?'aprovado':'recusado'}.</p>}
    </article>}
    <a href="/" className="mt-6 inline-flex min-h-11 items-center underline">Voltar ao site</a>
  </main>;
}
