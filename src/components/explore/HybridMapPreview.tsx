import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../../lib/googleMaps';

export function HybridMapPreview({ latitude, longitude, name }: { latitude?: number; longitude?: number; name: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const container = host.current;
    let cancelled = false;
    let map: google.maps.Map | undefined;
    let marker: google.maps.marker.AdvancedMarkerElement | undefined;
    setFailed(false);
    async function load() {
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) { setFailed(true); return; }
      try {
        await loadGoogleMaps();
        if (cancelled || !container) return;
        const position = { lat: latitude!, lng: longitude! };
        map = new google.maps.Map(container, {
          center: position, zoom: 18, mapTypeId: 'hybrid', mapId: 'DEMO_MAP_ID',
          streetViewControl: false, mapTypeControl: false, fullscreenControl: false,
          gestureHandling: 'cooperative', clickableIcons: false,
        });
        marker = new google.maps.marker.AdvancedMarkerElement({ map, position, title: name });
      } catch { if (!cancelled) setFailed(true); }
    }
    void load();
    return () => {
      cancelled = true;
      if (marker) marker.map = null;
      if (map) google.maps.event.clearInstanceListeners(map);
      container?.replaceChildren();
    };
  }, [latitude, longitude, name, attempt]);
  return <div className="relative h-56">
    <div ref={host} className="w-full h-full" aria-label={`Mapa aéreo de ${name}`} />
    {failed && <div role="status" className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center gap-2 text-sm"><p>Mapa indisponível. Use “Como chegar” para abrir o local.</p><button type="button" className="underline" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button></div>}
  </div>;
}
