import type { DisabilityType, Establishment } from '../../types';
import { ACCESSIBILITY_RESOURCES, resourceState } from '../../data/accessibilityResources';
import { DISABILITY_INFO } from './DisabilityBadge';

const MAIN_CATEGORIES: DisabilityType[] = ['mobilidade', 'visual', 'auditiva', 'intelectual', 'invisivel'];

export function AccessibilityIcons({ establishment }: { establishment: Establishment }) {
  const criteria = establishment.criteria ?? [];
  const supported = new Set<DisabilityType>();

  for (const resource of ACCESSIBILITY_RESOURCES) {
    if (resourceState(criteria, resource.id) === 'sim') supported.add(resource.tipo);
  }
  // Keep older free-text categories alongside structured resources.
  for (const criterion of criteria) {
    const isResource = criterion.recurso || ACCESSIBILITY_RESOURCES.some(resource =>
      resource.legacy === criterion.criterio || (resource.id === 'libras' && criterion.criterio === 'Atendente capacitado em Libras'));
    if (!isResource && criterion.presente === true) supported.add(criterion.tipo_deficiencia);
  }

  const categories = MAIN_CATEGORIES.filter(type => supported.has(type));
  if (!categories.length) return <p className="text-sm text-slate-600">Recursos ainda não informados</p>;

  return <ul className="flex flex-wrap gap-2" aria-label="Categorias com recursos de acessibilidade informados">
    {categories.map(type => {
      const { icon: Icon, shortLabel, label } = DISABILITY_INFO[type];
      return <li key={type} title={`${label}: recursos informados no cadastro`} className="place-card-accessibility-badge">
        <Icon size={16} aria-hidden="true" />
        <span>{shortLabel}</span>
      </li>;
    })}
  </ul>;
}
