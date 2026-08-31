import React from 'react';

export const SkipLinks: React.FC = () => {
  return (
    <nav aria-label="Atalhos de acessibilidade" className="relative">
      <a
        href="#main-content"
        className="skip-link focus:ring-4 focus:ring-yellow-300 focus:outline-none"
      >
        Pular para o conteúdo principal (Enter)
      </a>
      <a
        href="#search-filter-section"
        className="skip-link !left-64 focus:ring-4 focus:ring-yellow-300 focus:outline-none"
      >
        Pular para a busca e filtros (Enter)
      </a>
      <a
        href="#results-section"
        className="skip-link !left-[31rem] focus:ring-4 focus:ring-yellow-300 focus:outline-none"
      >
        Pular para os resultados (Enter)
      </a>
    </nav>
  );
};
