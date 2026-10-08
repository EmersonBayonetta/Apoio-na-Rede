import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Footprints } from 'lucide-react';
import { fetchWalkingRoute, type RouteDestination } from '../../services/routeService';
import { formatWalkingSummary } from '../../utils/formatDistance';
import { directionsUrl } from '../../utils/directionsUrl';

type RouteState = { status: 'idle' | 'loading' } | { status: 'done'; summary: string } | { status: 'error'; message: string };

export function WalkingRoute({ destination }: { destination: RouteDestination & { place_id?: string;coordenadas_confirmadas?:boolean;endereco?:string;cidade?:string;estado?:string } }) {
  const [route, setRoute] = useState<RouteState>({ status: 'idle' });
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    setRoute({ status: 'idle' });
    request.current?.abort();
    return () => { request.current?.abort(); };
  }, [destination.id, destination.latitude, destination.longitude]);

  const calculate = () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    if (!('geolocation' in navigator)) {
      setRoute({ status: 'error', message: 'Este navegador não informa sua localização. Abra o trajeto no Google Maps.' });
      return;
    }
    setRoute({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(async position => {
      if (controller.signal.aborted) return;
      try {
        const result = await fetchWalkingRoute({ latitude: position.coords.latitude, longitude: position.coords.longitude }, destination, controller.signal);
        if (controller.signal.aborted) return;
        setRoute({ status: 'done', summary: formatWalkingSummary(result.distance, result.duration) });
      } catch {
        if (controller.signal.aborted) return;
        setRoute({ status: 'error', message: 'Não foi possível calcular a rota agora. Tente de novo ou abra o trajeto no Google Maps.' });
      }
    }, () => {
      if (!controller.signal.aborted) setRoute({ status: 'error', message: 'Sem acesso à sua localização. Autorize a localização no navegador ou abra o trajeto no Google Maps.' });
    }, { timeout: 15000 });
  };

  return <section aria-labelledby="walking-route-title" className="mt-4 max-w-3xl rounded-2xl border border-slate-200 p-4">
    <h2 id="walking-route-title" className="flex items-center gap-2 text-lg font-bold text-slate-900"><Footprints size={20} aria-hidden="true" />Como chegar a pé</h2>
    <div className="mt-3 flex flex-wrap gap-3">
      {destination.coordenadas_confirmadas!==false&&<button type="button" onClick={calculate} disabled={route.status === 'loading'} className="min-h-11 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-70">
        {route.status === 'loading' ? 'Calculando…' : 'Calcular rota a pé'}
      </button>}
      <a href={directionsUrl(destination)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-800">
        Abrir no Google Maps <ExternalLink size={15} aria-hidden="true" /><span className="sr-only">(abre em nova aba)</span>
      </a>
    </div>
    {destination.coordenadas_confirmadas===false&&<p className="mt-3 text-sm text-slate-600">Abra o endereço no Google Maps para escolher o acesso correto ao local.</p>}
    <div aria-live="polite">
      {route.status === 'done' && <div className="mt-3">
        <p className="walking-summary text-xl font-bold text-slate-900">{route.summary}</p>
        <p className="text-sm text-slate-600">Rota calculada pelo OpenStreetMap. Não verifica calçadas, rampas ou obstáculos.</p>
      </div>}
    </div>
    {route.status === 'error' && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-900">{route.message}</p>}
  </section>;
}
