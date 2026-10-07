import { useState } from 'react';
import { SignInGate } from './SignInGate';
import { DirectoryService } from '../../services/directoryService';
import { MOCK_PROFESSIONALS, MOCK_ROUTES } from '../../data/mockData';
import { validateProfessional, validateRoute } from '../../utils/communityDirectory';
import type { AccessibleRoute, Professional } from '../../types';

type Catalog = { routes: AccessibleRoute[]; professionals: Professional[] };
function parseCatalog(value: unknown): Catalog {
  if (!value || typeof value !== 'object') throw new Error('Arquivo de catálogo inválido.');
  const data = value as Catalog;
  if (!Array.isArray(data.routes) || !Array.isArray(data.professionals) || data.routes.length + data.professionals.length > 200) throw new Error('Informe um catálogo com até 200 cadastros.');
  const routes = data.routes.filter(r => !MOCK_ROUTES.some(mock => mock.id === r.id)).map(r => {
    if (typeof r.id !== 'string' || !r.id || r.id.length > 200 || ![r.tem_rampa,r.tem_piso_tatil,r.tem_semaforo_sonoro].every(v => typeof v === 'boolean')) throw new Error('Rota inválida.');
    return { ...validateRoute({origin:r.ponto_origem,destination:r.ponto_destino,city:r.cidade,description:r.trecho_descricao,ramp:r.tem_rampa,tactile:r.tem_piso_tatil,signal:r.tem_semaforo_sonoro}),id:r.id };
  });
  const professionals = data.professionals.filter(p => !MOCK_PROFESSIONALS.some(mock => mock.id === p.id)).map(p => {
    if (typeof p.id !== 'string' || !p.id || p.id.length > 200 || !Array.isArray(p.atende_por_tipo) || p.atende_por_tipo.some(t => !['mobilidade','visual','auditiva','intelectual','invisivel'].includes(t))) throw new Error('Profissional inválido.');
    return {...validateProfessional(p),id:p.id};
  });
  return {routes,professionals};
}
function localCatalog(): Catalog {
  return parseCatalog({routes:JSON.parse(localStorage.getItem('acessacidade_routes') || '[]'),professionals:JSON.parse(localStorage.getItem('acessacidade_professionals') || '[]')});
}
export function ImportLocalDirectory({onImported}:{onImported:()=>void}) {
  const [catalog,setCatalog] = useState<Catalog>({routes:[],professionals:[]});
  const [message,setMessage] = useState('');
  const [busy,setBusy] = useState(false);
  const showError = (error: unknown) => setMessage(error instanceof Error ? error.message : 'Não foi possível ler o catálogo.');
  const load = () => { try { setCatalog(localCatalog()); setMessage('Cadastros locais carregados. Exemplos de demonstração foram excluídos.'); } catch(error) { showError(error); } };
  const send = async () => {
    setBusy(true); let sent = 0; let duplicates = 0;
    try {
      for (const [kind,items] of [['routes',catalog.routes],['professionals',catalog.professionals]] as const) {
        for (const item of items) {
          try {
            if (kind === 'routes') await DirectoryService.saveRoute(item as AccessibleRoute,`local:${item.id}`);
            else await DirectoryService.saveProfessional(item as Professional,`local:${item.id}`);
            sent++;
          } catch(error) {
            if (error instanceof Error && error.message === 'Este cadastro local já foi enviado para revisão.') duplicates++;
            else throw error;
          }
        }
      }
      setMessage(`${sent} enviados para revisão; ${duplicates} já enviados anteriormente.`);
    } catch(error) { setMessage(`${sent} enviados; ${duplicates} já enviados. ${error instanceof Error ? error.message : 'Falha no envio.'} Você pode tentar novamente sem duplicar os cadastros.`); }
    finally { setBusy(false); onImported(); }
  };
  return <details className="mt-6 rounded-xl border p-4"><summary className="cursor-pointer min-h-11">Importar cadastros feitos anteriormente neste navegador</summary>
    <p className="my-3">Abra esta opção no endereço onde criou os cadastros, carregue os dados e exporte o arquivo. No site publicado, selecione o arquivo e envie para revisão. Envie somente informações reais e contatos cuja publicação foi autorizada. Limite: 10 cadastros de cada tipo por dia.</p>
    <button type="button" disabled={busy} className="min-h-11 underline mr-4" onClick={load}>Carregar dados deste navegador</button>
    <label className="block my-3">Selecionar arquivo de catálogo<input type="file" accept="application/json,.json" disabled={busy} className="block" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; try { if (file.size > 500000) throw new Error('O arquivo deve ter até 500 KB.'); setCatalog(parseCatalog(JSON.parse(await file.text()))); setMessage('Arquivo carregado. Confira os cadastros antes de enviar.'); } catch(error) { setCatalog({routes:[],professionals:[]}); showError(error); } e.target.value = ''; }}/></label>
    <p>{catalog.routes.length} rotas e {catalog.professionals.length} profissionais.</p>
    <ul className="my-3">{catalog.routes.map(r => <li key={`r:${r.id}`}>{r.titulo}</li>)}{catalog.professionals.map(p => <li key={`p:${p.id}`}>{p.nome} — {p.especialidade}</li>)}</ul>
    {!!(catalog.routes.length + catalog.professionals.length) && <><button type="button" disabled={busy} className="min-h-11 underline" onClick={() => { const url = URL.createObjectURL(new Blob([JSON.stringify(catalog,null,2)],{type:'application/json'})); const link = document.createElement('a'); link.href = url; link.download = 'apoio-catalogo-local.json'; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); }}>Exportar arquivo</button><SignInGate><button type="button" disabled={busy} className="min-h-11 border rounded-lg px-4 my-3" onClick={()=>void send()}>{busy ? 'Enviando…' : 'Enviar cadastros para revisão'}</button></SignInGate></>}
    <p role="status" aria-live="polite">{message}</p>
  </details>;
}
