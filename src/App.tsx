import React, { useState, useEffect } from 'react';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { Navbar } from './components/Navbar';
import { AccessibilityToolbar } from './components/AccessibilityToolbar';
import { AccessibilityOnboarding } from './components/AccessibilityOnboarding';
import { ExplorerView } from './views/ExplorerView';
import { EstablishmentDetailView } from './views/EstablishmentDetailView';
import { MerchantRegisterWizard } from './views/MerchantRegisterWizard';
import { Establishment } from './types';
import { StorageService } from './services/storageService';
import { ShieldCheck } from 'lucide-react';

export const MainAppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'explorer' | 'register'>('explorer');
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  useEffect(() => {
    document.title = 'Apoio na rede — Acessibilidade urbana';
  }, []);

  const handleSelectEstablishment = (est: Establishment) => {
    setSelectedEstablishment(est);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToExplorer = () => {
    setSelectedEstablishment(null);
    setCurrentTab('explorer');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Barra de Navegação Principal */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedEstablishment(null);
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Área de Conteúdo Principal */}
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {selectedEstablishment ? (
          <EstablishmentDetailView
            establishment={selectedEstablishment}
            onBack={handleBackToExplorer}
            onRefresh={async () => {
              const updated = await StorageService.getEstablishmentById(selectedEstablishment.id);
              if (updated) setSelectedEstablishment(updated);
            }}
          />
        ) : (
          <>
            {currentTab === 'explorer' && (
              <ExplorerView onSelectEstablishment={handleSelectEstablishment} />
            )}
            {currentTab === 'register' && (
              <MerchantRegisterWizard
                onSuccess={() => {
                  setCurrentTab('explorer');
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Barra Flutuante de Acessibilidade */}
      <AccessibilityOnboarding />
      <AccessibilityToolbar />

      {/* Rodapé Acessível */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <img
              src="/brand/apoio-na-rede-logo-white.png"
              alt="Apoio na rede"
              className="h-14 w-auto object-contain mb-3"
            />
            <p className="text-sm text-slate-400 leading-relaxed max-w-md mb-4">
              Informações sobre acessibilidade em locais e serviços de Cataguases para ajudar no planejamento antes de sair de casa.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Interface orientada pelas WCAG; critérios dos locais baseados na NBR 9050</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
              Recursos de Acessibilidade
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Checklist baseado na NBR 9050</li>
              <li>Integração com VLibras</li>
              <li>Busca e navegação por voz</li>
              <li>Leitura de páginas em voz alta</li>
              <li>Alto contraste e fonte para dislexia</li>
              <li>Navegação completa por teclado</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
              Canais & Apoio
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEstablishment(null);
                    setCurrentTab('register');
                  }}
                  className="hover:text-white transition-colors"
                >
                  Cadastre seu Estabelecimento
                </button>
              </li>
              <li>
                <a
                  href="https://www.gov.br/mdh/pt-br/assuntos/pessoa-com-deficiencia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Direitos da Pessoa com Deficiência (Gov.br) ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Apoio na rede. Código aberto e inclusivo.</p>
          <p className="text-slate-400">Informações comunitárias sujeitas a atualização.</p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AccessibilityProvider>
      <MainAppContent />
    </AccessibilityProvider>
  );
}
