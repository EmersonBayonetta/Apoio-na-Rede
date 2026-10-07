import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

let loading: Promise<void> | undefined;

export function loadGoogleMaps(): Promise<void> {
  // Reutiliza a API quando ela já foi carregada pela página.
  if (typeof google !== 'undefined' && typeof google.maps?.importLibrary === 'function') {
    return Promise.all([google.maps.importLibrary('maps'), google.maps.importLibrary('marker')]).then(() => undefined);
  }
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  if (!key) return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY não configurada'));
  if (!loading) {
    setOptions({ key, v: 'weekly', language: 'pt-BR', region: 'BR' });
    loading = Promise.all([importLibrary('maps'), importLibrary('marker')])
      .then(() => undefined)
      .catch(error => { loading = undefined; throw error; });
  }
  return loading;
}
