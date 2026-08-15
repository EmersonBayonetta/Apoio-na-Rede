import React, { useState, useEffect } from 'react';
import { AccessibleRoute } from '../types';
import { StorageService } from '../services/storageService';
import { MapLeaflet } from '../components/MapLeaflet';
import { AudioReaderButton } from '../components/AudioReaderButton';
import {
  Route as RouteIcon,
  CheckCircle2,
  XCircle,
  Volume2,
  ShieldCheck,
  Navigation,
  Sparkles,
} from 'lucide-react';

export const AccessibleRoutesView: React.FC = () => {
  const [routes, setRoutes] = useState<AccessibleRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<AccessibleRoute | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const list = await StorageService.getRoutes();
        setRoutes(list);
        if (list.length > 0) setSelectedRoute(list[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800 animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg mb-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-700/80 text-blue-100 text-xs font-bold mb-3 border border-blue-400/30">
            <Sparkles size={14} className="text-yellow-300" aria-hidden="true" />
            <span>Mapeamento de Calçadas & Rotas Seguras</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
            Rotas Urbanas Acessíveis
          </h1>
          <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed">
            Consulte trajetos a pé auditados com foco em calçadas sem buracos, rampas de rebaixamento suaves, piso tátil direcional e semáforos sonoros.
          </p>
        </div>
      </div>

      {/* Grid Principal: Lista de Rotas + Visualizador no Mapa */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {/* Coluna Esquerda: Lista de Rotas Mapeadas */}
        <div className="space-y-4">
          <h2 className="text-sm font-black text-slate-500 uppercase tracking-wider">
            Trechos Auditados ({routes.length})
          </h2>

          <div className="space-y-3">
            {routes.map((route) => {
              const isSelected = selectedRoute?.id === route.id;
              return (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => setSelectedRoute(route)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-400'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-black text-blue-700 uppercase bg-blue-100/70 px-2 py-0.5 rounded-md">
                      {route.cidade}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {route.distancia_metros}m
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 leading-snug mb-2">
                    {route.titulo}
                  </h3>

                  <div className="grid grid-cols-3 gap-1 text-[11px] font-semibold text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      {route.tem_rampa ? (
                        <CheckCircle2 size={13} className="text-emerald-600" />
                      ) : (
                        <XCircle size={13} className="text-slate-400" />
                      )}
                      <span>Rampa</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {route.tem_piso_tatil ? (
                        <CheckCircle2 size={13} className="text-emerald-600" />
                      ) : (
                        <XCircle size={13} className="text-slate-400" />
                      )}
                      <span>Piso Tátil</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {route.tem_semaforo_sonoro ? (
                        <Volume2 size={13} className="text-emerald-600" />
                      ) : (
                        <XCircle size={13} className="text-slate-400" />
                      )}
                      <span>Som</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Coluna Direita: Mapa e Detalhes da Rota Selecionada */}
        <div className="lg:col-span-2 space-y-4">
          {selectedRoute && (
            <>
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <RouteIcon className="text-blue-600" size={24} />
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedRoute.titulo}
                    </h3>
                  </div>
                  <AudioReaderButton
                    textToRead={`${selectedRoute.titulo}. Origem: ${selectedRoute.ponto_origem}. Destino: ${selectedRoute.ponto_destino}. Descrição: ${selectedRoute.trecho_descricao}. Nível de segurança: ${selectedRoute.nivel_seguranca}.`}
                    label="Ouvir rota"
                    size="sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/80 mb-4">
                  <div>
                    <span className="font-bold text-slate-400 uppercase block">Ponto de Partida</span>
                    <strong className="text-slate-800">{selectedRoute.ponto_origem}</strong>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase block">Destino</span>
                    <strong className="text-slate-800">{selectedRoute.ponto_destino}</strong>
                  </div>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed mb-4">
                  {selectedRoute.trecho_descricao}
                </p>

                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                  <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                  <span>{selectedRoute.nivel_seguranca}</span>
                </div>
              </div>

              {/* Mapa com o Traçado da Rota */}
              <MapLeaflet
                activeRoute={selectedRoute}
                center={selectedRoute.coordenadas[0]}
                zoom={16}
                heightClass="h-[400px]"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
