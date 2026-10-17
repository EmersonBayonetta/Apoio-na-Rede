import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaControls() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const display = window.matchMedia('(display-mode: standalone)');
    const sync = () => setInstalled(display.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const available = (event: Event) => { event.preventDefault(); setPrompt(event as InstallEvent); };
    const complete = () => { setInstalled(true); setPrompt(null); };
    sync();
    display.addEventListener('change', sync);
    window.addEventListener('beforeinstallprompt', available);
    window.addEventListener('appinstalled', complete);
    return () => {
      display.removeEventListener('change', sync);
      window.removeEventListener('beforeinstallprompt', available);
      window.removeEventListener('appinstalled', complete);
    };
  }, []);

  const install = async () => {
    if (!prompt || installing) return;
    setInstalling(true);
    setError('');
    try {
      await prompt.prompt();
      await prompt.userChoice;
      setPrompt(null);
    } catch {
      setError('Use o menu do navegador para instalar o aplicativo.');
      setPrompt(null);
    } finally { setInstalling(false); }
  };

  if (installed) return null;
  return <div className="pwa-install">
    {prompt ? <button type="button" className="pwa-install-button" disabled={installing} onClick={() => void install()}>
      <Download size={18} aria-hidden="true" />{installing ? 'Abrindo instalação…' : 'Instalar app'}
    </button> : <details>
      <summary>Instalar app no celular</summary>
      <p>No Android, abra o menu do navegador e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”. No iPhone ou iPad, abra no Safari, toque em Compartilhar e em “Adicionar à Tela de Início”.</p>
    </details>}
    {error && <p role="status">{error}</p>}
  </div>;
}

export function OfflineNotice() {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => { window.removeEventListener('online', sync); window.removeEventListener('offline', sync); };
  }, []);
  return offline ? <p role="status" className="offline-notice">Você está sem conexão. A interface está disponível, mas buscas, mapas e envio de cadastros precisam de internet.</p> : null;
}
