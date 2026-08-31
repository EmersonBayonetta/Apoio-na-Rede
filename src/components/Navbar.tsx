import React, { useState } from 'react';
import {
  MapPin,
  PlusCircle,
  Menu,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { UserPreferencesModal } from './UserPreferencesModal';

interface NavbarProps {
  currentTab: 'explorer' | 'register';
  onSelectTab: (tab: 'explorer' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPrefModalOpen, setIsPrefModalOpen] = useState(false);

  const navItems: {
    id: 'explorer' | 'register';
    label: string;
    icon: React.ElementType;
  }[] = [
    { id: 'explorer', label: 'Mapa & Catálogo', icon: MapPin },
    { id: 'register', label: 'Cadastrar Local', icon: PlusCircle },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-blue-950/10 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
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
                className="h-11 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </button>
          </div>

          {/* Links Desktop */}
          <nav aria-label="Navegação Principal" className="hidden lg:flex items-center gap-1 rounded-full border border-blue-950/10 bg-white/70 p-1 shadow-sm">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all relative ${
                    isActive
                      ? 'bg-blue-950 text-white shadow-sm'
                      : 'text-slate-600 hover:text-blue-950 hover:bg-blue-50'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Preferências locais e navegação móvel */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Botão de Preferências */}
            <button
              type="button"
              onClick={() => setIsPrefModalOpen(true)}
              className="p-2.5 text-slate-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Ajustar preferências de deficiência para filtros automáticos"
              aria-label="Minhas preferências de acessibilidade"
            >
              <SlidersHorizontal size={18} aria-hidden="true" />
              <span className="hidden md:inline">Preferências</span>
            </button>

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
