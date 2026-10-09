import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { MAP_CATEGORIES } from '../../data/mapCategories';
import type { EstablishmentCategory } from '../../types';

const iconColors = ['#ff975c', '#6fc6f1', '#dba0ff', '#a5d76e', '#f1c86b', '#62d4c9', '#ffb45f', '#ff96bf', '#b2a7ff'];

export function ExploreCategories({ selected, onSelect }: { selected: EstablishmentCategory | 'todas'; onSelect: (id: EstablishmentCategory | 'todas') => void }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(9);
  const categories = Object.entries(MAP_CATEGORIES);
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const observer = new ResizeObserver(() => {
      const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      setVisibleCount(columns * 2);
    });
    observer.observe(grid);
    return () => observer.disconnect();
  }, []);
  const hasMore = visibleCount < categories.length;
  return <>
    <section className="category-section" aria-labelledby="category-shortcuts-title">
      <div className="section-heading"><div><span className="section-kicker">EXPLORE DO SEU JEITO</span><h2 id="category-shortcuts-title">O que você procura?</h2></div>{hasMore && <button type="button" aria-expanded={expanded} aria-controls="category-shortcuts-grid" onClick={() => setExpanded(value => !value)}>{expanded ? 'Ver menos' : 'Ver todas'} <ArrowRight size={16} aria-hidden="true" /></button>}</div>
      <div ref={gridRef} id="category-shortcuts-grid" className="category-grid">{categories.map(([id, category], index) => {
        const Icon = category.icon;
        return <button hidden={!expanded && index >= visibleCount} key={id} type="button" aria-pressed={selected === id} onClick={() => onSelect(id as EstablishmentCategory)} className="category-tile">
          <Icon size={29} strokeWidth={1.6} color={iconColors[index]} aria-hidden="true" /><span>{id === 'banheiro_adaptado' ? 'Banheiros' : category.label.replace(' & Clínicas', '').replace(' & Lojas', '').replace('Lazer & Cultura', 'Lazer').replace('Serviço Público', 'Serviços')}</span>
        </button>;
      })}</div>
    </section>
  </>;
}
