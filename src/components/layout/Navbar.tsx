import { useEffect, useState } from 'react';
import { Compass, HeartHandshake, Stethoscope, Building2, ClipboardList, Sun, Moon, LogOut, type LucideIcon } from 'lucide-react';
import { browserStorage } from '../../lib/browserStorage';
import { UserPreferencesModal } from '../accessibility/UserPreferencesModal';
import type { AppTab } from '../../utils/appTabs';
import { useAuth } from '../../context/AuthContext';
import { visibleNavigationTabs } from '../../utils/navigationAccess';

interface NavbarProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

const DESTINATIONS: { tab: AppTab; label: string; desktopLabel: string; icon: LucideIcon }[] = [
  { tab: 'explorer', label: 'Explorar', desktopLabel: 'Explorar', icon: Compass },
  { tab: 'professionals', label: 'Profissionais', desktopLabel: 'Profissionais', icon: Stethoscope },
  { tab: 'register', label: 'Cadastrar', desktopLabel: 'Cadastrar local', icon: Building2 },
  { tab: 'my_places', label: 'Meus locais', desktopLabel: 'Meus locais', icon: ClipboardList },
];

export function Navbar({ currentTab, onSelectTab }: NavbarProps) {
  const { user, signOut } = useAuth();
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
    const inactive = destination.tab === 'routes';
    return <button key={destination.tab} type="button" disabled={inactive} title={inactive ? 'Rotas acessíveis temporariamente indisponíveis' : undefined} aria-label={inactive ? 'Rotas acessíveis — temporariamente indisponíveis' : undefined} aria-current={!inactive && currentTab === destination.tab ? 'page' : undefined} onClick={() => onSelectTab(destination.tab)}>
      <Icon size={mobile ? 22 : 17} aria-hidden="true" />{mobile ? <span>{destination.label}</span> : destination.desktopLabel}
    </button>;
  };
  return <>
    <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
    <header className="app-header">
      <div className="header-inner">
        <button type="button" onClick={() => onSelectTab('explorer')} className="brand-logo" aria-label="Apoio na rede - Página inicial">
          <img src={theme === 'light' ? '/brand/apoio-na-rede-logo.png' : '/brand/apoio-na-rede-logo-white.png'} alt="" />
        </button>
        <nav className="desktop-navigation" aria-label="Navegação principal">
          {DESTINATIONS.filter(destination => visibleNavigationTabs(Boolean(user)).includes(destination.tab)).map(destination => destinationButton(destination, false))}
          <button type="button" aria-haspopup="dialog" onClick={() => setIsPrefModalOpen(true)}><HeartHandshake size={17} aria-hidden="true" />Minhas necessidades</button>
        </nav>
        {user && <button type="button" className="theme-toggle" onClick={() => void signOut().then(() => onSelectTab('explorer'))} aria-label="Encerrar sessão" title="Encerrar sessão"><LogOut size={18} aria-hidden="true" /></button>}
        <button
          type="button"
          className="theme-toggle header-preferences"
          onClick={() => setTheme(previous => previous === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
          {theme === 'dark' ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
        </button>
      </div>
    </header>
    <nav className="mobile-navigation" aria-label="Navegação do celular">
      {DESTINATIONS.filter(destination => visibleNavigationTabs(Boolean(user)).includes(destination.tab)).map(destination => destinationButton(destination, true))}
      <button type="button" aria-haspopup="dialog" onClick={() => setIsPrefModalOpen(true)}><HeartHandshake size={22} aria-hidden="true" /><span>Minhas necessidades</span></button>
      {user && <button type="button" onClick={() => void signOut().then(() => onSelectTab('explorer'))}><LogOut size={22} aria-hidden="true" /><span>Sair</span></button>}
    </nav>
    <UserPreferencesModal isOpen={isPrefModalOpen} onClose={() => setIsPrefModalOpen(false)} />
  </>;
}
