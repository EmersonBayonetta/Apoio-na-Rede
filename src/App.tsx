import React, { useState, useEffect } from 'react';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { Navbar } from './components/layout/Navbar';
import { AccessibilityToolbar } from './components/accessibility/AccessibilityToolbar';
import { ExplorerView } from './views/ExplorerView';
import { EstablishmentDetailView } from './views/EstablishmentDetailView';
import { MerchantRegisterWizard } from './views/MerchantRegisterWizard';
import { Establishment } from './types';
import { StorageService } from './services/storageService';
import { PlacesService } from './services/placesService';
import { ContributionService, confirmedCriteria, localKey } from './services/contributionService';
import { RegistrationReviewView } from './views/RegistrationReviewView';
import { browserStorage } from './lib/browserStorage';
import { CommunityDirectoryView } from './views/CommunityDirectoryView';
import { tabFromUrl, urlForTab, type AppTab } from './utils/appTabs';

export const MainAppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AppTab>(() => tabFromUrl(window.location.search));
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [temporaryStorage, setTemporaryStorage] = useState(browserStorage.isTemporary);
  const [navigationMessage, setNavigationMessage] = useState('');
  useEffect(() => {
    const warn = () => setTemporaryStorage(true);
    window.addEventListener('storage-unavailable', warn);
    // Child effects (e.g. the theme save in Navbar) run first and may have failed already.
    if (browserStorage.isTemporary()) warn();
    const restoreLocal = async () => {
      setCurrentTab(tabFromUrl(window.location.search));
      const id = new URL(window.location.href).searchParams.get('local');
      if (!id) { setSelectedEstablishment(null); return; }
      let local: Establishment | null = null;
      try {
        local = id.startsWith('external-') ? JSON.parse(browserStorage.getItem('apoio_external_' + id) || 'null') : await StorageService.getEstablishmentById(id);
        if (local?.external) local.criteria = confirmedCriteria(await ContributionService.approved(localKey(local)), local.id);
      if(local?.external&&local.place_id&&!local.place_id.startsWith('osm-')) {
        try{local={...local,...await PlacesService.contact(local.place_id)};}catch{setNavigationMessage('Os contatos públicos deste local não carregaram.');}
      }
      } catch { setNavigationMessage('Falha ao carregar o local. Tente novamente.'); return; }
      setSelectedEstablishment(local);
      setNavigationMessage(local ? '' : 'Este local não está disponível. Confira o endereço ou tente novamente mais tarde.');
    };
    void restoreLocal();
    window.addEventListener('popstate', restoreLocal);
    return () => { window.removeEventListener('storage-unavailable', warn); window.removeEventListener('popstate', restoreLocal); };
  }, []);
  const updateLocalUrl = (id?: string) => {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('local', id); else url.searchParams.delete('local');
    window.history.pushState(null, '', url);
    setNavigationMessage('');
  };
  useEffect(() => {
    document.title = 'Apoio na rede — Acessibilidade urbana';
  }, []);

  const handleSelectEstablishment = (est: Establishment) => {
    if (est.external) {
      browserStorage.setItem('apoio_external_' + est.id, JSON.stringify(est));
      void ContributionService.approved(localKey(est)).then(reports => setSelectedEstablishment(current => current?.id === est.id ? { ...current, criteria: confirmedCriteria(reports, est.id) } : current)).catch(() => setNavigationMessage('Falha ao consultar relatos. Tente novamente.'));
      if(est.place_id&&!est.place_id.startsWith('osm-'))void PlacesService.contact(est.place_id).then(contact=>{
        setSelectedEstablishment(current=>current?.id===est.id?{...current,...contact}:current);
      }).catch(()=>setNavigationMessage('Os contatos públicos deste local não carregaram. Tente novamente mais tarde.'));
    }
    updateLocalUrl(est.id);
    setSelectedEstablishment(est);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectTab = (tab: AppTab) => {
    if (window.location.href !== urlForTab(tab, window.location.href)) window.history.pushState(null, '', urlForTab(tab, window.location.href));
    setNavigationMessage('');
    setSelectedEstablishment(null);
    setCurrentTab(tab);
  };

  const handleBackToExplorer = () => selectTab('explorer');

  return (
    <div className="min-h-screen flex flex-col text-slate-900">
      {/* Barra de Navegação Principal */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          selectTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Área de Conteúdo Principal */}
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {temporaryStorage && <p role="status" className="m-4 rounded-xl border p-4">O navegador não conseguiu salvar os dados. Você pode continuar, mas as alterações desta sessão serão perdidas ao fechar ou recarregar a página.</p>}
        {navigationMessage && <p role="status" className="m-4 rounded-xl border p-4">{navigationMessage}</p>}
        {selectedEstablishment ? (
          <EstablishmentDetailView
            establishment={selectedEstablishment}
            onBack={handleBackToExplorer}
            onRefresh={async () => {
              try {
              const updated = selectedEstablishment.external
                ? { ...selectedEstablishment, criteria: confirmedCriteria(await ContributionService.approved(localKey(selectedEstablishment)), selectedEstablishment.id) }
                : await StorageService.getEstablishmentById(selectedEstablishment.id);
              if (updated) setSelectedEstablishment(updated);
              } catch { setNavigationMessage('Não foi possível atualizar as informações do local. Tente novamente.'); }
            }}
          />
        ) : (
          <>
            {currentTab === 'explorer' && (
              <ExplorerView onSelectEstablishment={handleSelectEstablishment} />
            )}
            {currentTab === 'register' && (
              <div className="max-w-4xl mx-auto p-4"><MerchantRegisterWizard onSuccess={() => selectTab('explorer')} /></div>
            )}
            {currentTab === 'routes' && <CommunityDirectoryView section="routes" />}
            {currentTab === 'professionals' && <CommunityDirectoryView section="professionals" />}
          </>
        )}
      </main>

      {/* Barra Flutuante de Acessibilidade */}
      <AccessibilityToolbar />

      {/* Rodapé Acessível */}
      <footer className="bg-blue-950 text-slate-300 border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <img
              src="/brand/apoio-na-rede-logo-white.png"
              alt="Apoio na rede"
              className="h-14 w-auto object-contain mb-3"
            />
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              Informações colaborativas sobre acessibilidade em Cataguases. As condições podem mudar: confirme com o local antes de sair.
            </p>
          </div>
          <a
            href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Lei Brasileira de Inclusão ↗<span className="sr-only"> (abre em nova aba)</span>
          </a>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Apoio na rede</p>
          <p>Dados de locais e endereços: Google Maps, ViaCEP e <a className="underline hover:text-white" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap</a>.</p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AccessibilityProvider>
      {window.location.pathname.replace(/\/$/, '') === '/revisao' ? <RegistrationReviewView /> : <MainAppContent />}
    </AccessibilityProvider>
  );
}
