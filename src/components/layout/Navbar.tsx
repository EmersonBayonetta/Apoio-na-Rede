import { useEffect, useState } from 'react';
import { Compass, HeartHandshake, Route, Stethoscope, Building2, Sun, Moon, type LucideIcon } from 'lucide-react';
import { browserStorage } from '../../lib/browserStorage';
import { UserPreferencesModal } from '../accessibility/UserPreferencesModal';
import type { AppTab } from '../../utils/appTabs';

interface NavbarProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

const DESTINATIONS: { tab: AppTab; label: string; desktopLabel: string; icon: LucideIcon }[] = [
  { tab: 'explorer', label: 'Explorar', desktopLabel: 'Explorar', icon: Compass },
  { tab: 'routes', label: 'Rotas', desktopLabel: 'Rotas acessíveis', icon: Route },
  { tab: 'professionals', label: 'Profissionais', desktopLabel: 'Profissionais', icon: Stethoscope },
  { tab: 'register', label: 'Cadastrar', desktopLabel: 'Cadastrar local', icon: Building2 },
];

export function Navbar({ currentTab, onSelectTab }: NavbarProps) {
  const [isPrefModalOpen, setIsPrefModalOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    browserStorage.getItem('apoio_color_theme') === 'light' ? 'light' : 'dark');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    browserStorage.setItem('apoio_color_theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#ffffff' : '#101111');
  }, [theme]);
  useEffect(() => {
    const open = () => setIsPrefModalOpen(true);
    window.addEventListener('apoio:open-needs', open);
    return () => window.removeEventListener('apoio:open-needs', open);
  }, []);
  const destinationButton = (destination: typeof DESTINATIONS[number], mobile: boolean) => {
    const Icon = destination.icon;
    return <button key={destination.tab} type="button" aria-current={currentTab === destination.tab ? 'page' : undefined} onClick={() => onSelectTab(destination.tab)}>
      <Icon size={mobile ? 22 : 17} aria-hidden="true" />{mobile ? <span>{destination.label}</span> : destination.desktopLabel}
    </button>;
  };
  return <>
    <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
    <header className="app-header">
      <div className="header-inner">
        <button type="button" onClick={() => onSelectTab('explorer')} className="brand-logo" aria-label="Apoio na rede - Página inicial">
          <img className="brand-logo-dark" src="/brand/apoio-na-rede-logo-white.png" alt="" />
          <img className="brand-logo-light" src="/brand/apoio-na-rede-logo.png" alt="" />
        </button>
        <nav className="desktop-navigation" aria-label="Navegação principal">
          {DESTINATIONS.map(destination => destinationButton(destination, false))}
          <button type="button" aria-haspopup="dialog" onClick={() => setIsPrefModalOpen(true)}><HeartHandshake size={17} aria-hidden="true" />Minhas necessidades</button>
        </nav>
        <button
          type="button"
          className="theme-toggle header-preferences"
          onClick={() => setTheme(previous => previous === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
          {theme === 'dark' ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
          <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
        </button>
      </div>
    </header>
    <nav className="mobile-navigation" aria-label="Navegação do celular">
      {DESTINATIONS.map(destination => destinationButton(destination, true))}
      <button type="button" aria-haspopup="dialog" onClick={() => setIsPrefModalOpen(true)}><HeartHandshake size={22} aria-hidden="true" /><span>Minhas necessidades</span></button>
    </nav>
    <UserPreferencesModal isOpen={isPrefModalOpen} onClose={() => setIsPrefModalOpen(false)} />
  </>;
}
