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
  Accessibility,
} from 'lucide-react';
import { UserPreferencesModal } from './UserPreferencesModal';

interface NavbarProps {
  currentTab: 'explorer' | 'professionals' | 'routes' | 'register' | 'admin';
  onSelectTab: (tab: 'explorer' | 'professionals' | 'routes' | 'register' | 'admin') => void;
  pendingCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  pendingCount = 1,
}) => {
  const { currentUser, allUsers, switchUser } = useAuth();
  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPrefModalOpen, setIsPrefModalOpen] = useState(false);

  const navItems: {
    id: 'explorer' | 'professionals' | 'routes' | 'register' | 'admin';
    label: string;
    icon: React.ElementType;
    badge?: number;
  }[] = [
    { id: 'explorer', label: 'Mapa & Catálogo', icon: MapPin },
    { id: 'professionals', label: 'Profissionais', icon: HeartPulse },
    { id: 'routes', label: 'Rotas Acessíveis', icon: RouteIcon },
    { id: 'register', label: 'Cadastrar Local', icon: PlusCircle },
    {
      id: 'admin',
      label: 'Moderação',
      icon: ShieldAlert,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Marca */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectTab('explorer')}
              className="flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-600 rounded-2xl p-1 group"
              aria-label="AcessaCidade - Página Inicial"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Accessibility size={28} strokeWidth={2.5} aria-hidden="true" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-1">
                  Acessa<span className="text-blue-600">Cidade</span>
                </span>
                <span className="text-xs font-semibold text-slate-500 block">
                  Catálogo de Acessibilidade Urbana
                </span>
              </div>
            </button>
          </div>

          {/* Links Desktop */}
          <nav aria-label="Navegação Principal" className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all relative ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-xs ring-1 ring-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-blue-700' : 'text-slate-500'} aria-hidden="true" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-xs font-black animate-pulse">
                      {item.badge}
                    </span>
                  )}
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
              className="p-2.5 text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-2xl border border-slate-200 transition-colors flex items-center gap-1.5 text-xs font-bold"
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
                onClick={() => setIsPersonaOpen(!isPersonaOpen)}
                aria-expanded={isPersonaOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
                aria-label={`Perfil atual: ${currentUser?.nome || 'Usuário'}. Clique para trocar de persona de teste.`}
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
              {isPersonaOpen && (
                <div
                  role="menu"
                  aria-label="Trocar perfil de usuário para teste"
                  className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-3xl shadow-xl p-3 z-50 animate-fadeIn"
                >
                  <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                    Simular Persona / Papel
                  </div>
                  {allUsers.map((u) => {
                    const isSelected = u.id === currentUser?.id;
                    return (
                      <button
                        key={u.id}
                        role="menuitem"
                        onClick={() => {
                          switchUser(u.id);
                          setIsPersonaOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-colors ${
                          isSelected
                            ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <img
                          src={u.avatar_url}
                          alt=""
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {u.nome}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {u.bio || u.tipo}
                          </div>
                        </div>
                      </button>
                    );
                  })}
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
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-xs">
                      {item.badge}
                    </span>
                  )}
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
