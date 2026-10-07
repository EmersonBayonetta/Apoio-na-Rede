import { useEffect, useState } from 'react';
import { ContributionService, type PlaceReport } from '../../services/contributionService';
import { ACCESSIBILITY_RESOURCES } from '../../data/accessibilityResources';
import { imageFallback } from '../../utils/imageFallback';

export function ApprovedReports({ placeKey }: { placeKey: string }) {
  const [reports, setReports] = useState<PlaceReport[]>([]);
  const [message, setMessage] = useState('');
  const [photos, setPhotos] = useState<Record<string,string>>({});
  useEffect(() => {
    let active = true;
    setReports([]); setPhotos({}); setMessage('');
    void ContributionService.approved(placeKey).then(data => { if (active) setReports(data); }).catch(() => { if (active) setMessage('Não foi possível carregar os relatos aprovados.'); });
    return () => { active = false; };
  }, [placeKey]);
  if (!reports.length && !message) return null;
  return <section aria-labelledby="approved-reports-title" className="rounded-2xl border bg-white p-5 my-6">
    <h2 id="approved-reports-title" className="text-xl font-bold mb-4">Relatos aprovados da comunidade</h2>
    {message && <p role="status">{message}</p>}
    {reports.map(report => <details key={report.id} className="border rounded-xl p-3 mb-3">
      <summary className="min-h-11 cursor-pointer">Relato de {new Date(report.criado_em).toLocaleDateString('pt-BR')}</summary>
      <ul className="my-3">{ACCESSIBILITY_RESOURCES.map(resource => <li key={resource.id}>{resource.label}: {report.respostas[resource.id] === 'sim' ? 'Sim' : report.respostas[resource.id] === 'nao' ? 'Não' : 'Não sei'}</li>)}</ul>
      {report.comentario && <p>{report.comentario}</p>}
      {report.fotos.map((path,index) => <div key={index} className="mt-3">{photos[path]
        ? <img src={photos[path]} onError={imageFallback} alt={`Foto ${index + 1} do relato de acessibilidade`} className="max-h-80 rounded-xl" />
        : <button type="button" className="min-h-11 underline" onClick={async () => { try { const url = await ContributionService.photoUrl(path); setPhotos(previous => ({ ...previous, [path]: url })); } catch { setMessage('Não foi possível abrir a foto.'); } }}>Ver foto {index + 1}</button>}
      </div>)}
    </details>)}
  </section>;
}
