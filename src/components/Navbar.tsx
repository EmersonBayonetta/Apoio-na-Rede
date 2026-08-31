import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  HeartPulse,
  Route as RouteIcon,
  PlusCircle,
  ShieldAlert,
  User as UserIcon,
  ChevronDown,
  Menu,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { UserPreferencesModal } from './UserPreferencesModal';

interface NavbarProps {
  currentTab: 'explorer' | 'professionals' | 'routes' | 'register';
  onSelectTab: (tab: 'explorer' | 'professionals' | 'routes' | 'register') => void;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAdmin,
}) => {
  const { currentUser } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPrefModalOpen, setIsPrefModalOpen] = useState(false);

  const navItems: {
    id: 'explorer' | 'professionals' | 'routes' | 'register';
    label: string;
    icon: React.ElementType;
  }[] = [
    { id: 'explorer', label: 'Mapa & Catálogo', icon: MapPin },
    { id: 'professionals', label: 'Profissionais', icon: HeartPulse },
    { id: 'routes', label: 'Rotas Acessíveis', icon: RouteIcon },
    { id: 'register', label: 'Cadastrar Local', icon: PlusCircle },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Marca */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectTab('explorer')}
              className="flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-600 rounded-2xl p-1 group"
              aria-label="Apoio na rede - Página inicial"
            >
              <img
                src="/brand/apoio-na-rede-logo.png"
                alt="Apoio na rede"
                className="h-11 sm:h-12 w-auto object-contain transition-opacity group-hover:opacity-85"
              />
            </button>
          </div>

          {/* Links Desktop */}
          <nav aria-label="Navegação Principal" className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm transition-colors relative ${
                    isActive
                      ? 'bg-blue-50 text-blue-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Persona Switcher e Preferências */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Botão de Preferências */}
            <button
              type="button"
              onClick={() => setIsPrefModalOpen(true)}
              className="p-2.5 text-slate-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Ajustar preferências de deficiência para filtros automáticos"
              aria-label="Minhas preferências de acessibilidade"
            >
              <SlidersHorizontal size={18} aria-hidden="true" />
              <span className="hidden md:inline">Preferências</span>
            </button>

            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                aria-expanded={isProfileOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
                aria-label={`Perfil atual: ${currentUser?.nome || 'Usuário'}. Clique para trocar de perfil.`}
              >
                {currentUser?.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt=""
                    className="w-8 h-8 rounded-xl object-cover border border-slate-300"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <UserIcon size={18} />
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[130px]">
                    {currentUser?.nome.split(' ')[0]}
                  </div>
                  <div className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider">
                    {currentUser?.tipo}
                  </div>
                </div>
                <ChevronDown size={14} className="text-slate-400" aria-hidden="true" />
              </button>

              {/* Menu de Troca de Usuários */}
              {isProfileOpen && (
                <div
                  role="menu"
                  aria-label="Menu do perfil"
                  className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50 animate-fadeIn"
                >
                  <div className="flex items-center gap-3 px-2 py-2.5 border-b border-slate-100 mb-2">
                    {currentUser?.avatar_url ? (
                      <img src={currentUser.avatar_url} alt="" className="w-11 h-11 rounded-xl object-cover border border-slate-200" />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center"><UserIcon size={20} /></div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">{currentUser?.nome || 'Usuário'}</p>
                      <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
                      <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mt-0.5">{currentUser?.tipo}</p>
                    </div>
                  </div>
                  <button role="menuitem" onClick={() => { setIsPrefModalOpen(true); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <SlidersHorizontal size={17} className="text-slate-500" aria-hidden="true" />
                    Preferências de acessibilidade
                  </button>
                  {currentUser?.tipo === 'admin' && onOpenAdmin && (
                    <button role="menuitem" onClick={() => { onOpenAdmin(); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-blue-800 hover:bg-blue-50">
                      <ShieldAlert size={17} aria-hidden="true" />
                      Acessar área administrativa
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Botão Mobile Menu */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-2xl"
              aria-label="Abrir menu principal"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Menu Mobile Expandido */}
        {isMobileMenuOpen && (
          <nav
            aria-label="Menu Mobile"
            className="lg:hidden py-4 border-t border-slate-200 space-y-1 animate-fadeIn"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-sm ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className={isActive ? 'text-blue-700' : 'text-slate-500'} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        )}
      </div>

      <UserPreferencesModal
        isOpen={isPrefModalOpen}
        onClose={() => setIsPrefModalOpen(false)}
      />
    </header>
  );
};
