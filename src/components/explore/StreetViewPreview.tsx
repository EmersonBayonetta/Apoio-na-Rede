import { useEffect, useRef, useState } from 'react';
import type { StreetViewScene } from '../../services/streetViewService';

export function StreetViewPreview({ scene, name }: { scene: StreetViewScene; name: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const container = host.current;
    let cancelled = false;
    let panorama: google.maps.StreetViewPanorama | undefined;
    setFailed(false);
    void google.maps.importLibrary('streetView').then(library => {
      if (cancelled || !container) return;
      const { StreetViewPanorama } = library as google.maps.StreetViewLibrary;
      panorama = new StreetViewPanorama(container, {
        pano: scene.pano, pov: { heading: scene.heading, pitch: 0 }, zoom: 0,
        addressControl: false, linksControl: false, clickToGo: false, scrollwheel: false,
        motionTracking: false, motionTrackingControl: false,
      });
      panorama.addListener('status_changed', () => {
        if (!cancelled) setFailed(panorama?.getStatus() !== google.maps.StreetViewStatus.OK);
      });
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => {
      cancelled = true;
      if (panorama) { panorama.setVisible(false); google.maps.event.clearInstanceListeners(panorama); }
      container?.replaceChildren();
    };
  }, [scene.pano, scene.heading, attempt]);
  return <div className="relative h-56">
    <div ref={host} className="h-full w-full" aria-label={`Street View de ${name}`} />
    {failed && <div role="alert" className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center gap-2 text-sm"><p>Não foi possível abrir esta vista.</p><button type="button" className="underline" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button></div>}
  </div>;
}
