import type { DisabilityType, Establishment } from '../../types';
import { ACCESSIBILITY_RESOURCES, resourceForCriterion, resourceState } from '../../data/accessibilityResources';
import { DISABILITY_INFO } from './DisabilityBadge';

const MAIN_CATEGORIES: DisabilityType[] = ['mobilidade', 'visual', 'auditiva', 'intelectual', 'invisivel'];

export function AccessibilityIcons({ establishment }: { establishment?: Establishment }) {
  const criteria = establishment?.criteria ?? [];
  const supported = new Set<DisabilityType>();

  for (const resource of ACCESSIBILITY_RESOURCES) {
    if (resourceState(criteria, resource.id) === 'sim') supported.add(resource.tipo);
  }
  // Keep older free-text categories alongside structured resources.
  for (const criterion of criteria) {
    if (!criterion.recurso && !resourceForCriterion(criterion) && criterion.presente === true) supported.add(criterion.tipo_deficiencia);
  }

  return <ul className="flex flex-wrap gap-2" aria-label="Modalidades de acessibilidade">
    {MAIN_CATEGORIES.map(type => {
      const { icon: Icon, shortLabel } = DISABILITY_INFO[type];
      const state = supported.has(type) ? 'Recursos disponíveis' : criteria.some(criterion => criterion.tipo_deficiencia === type && criterion.presente === false) ? 'Recursos não atendidos' : 'Sem recursos confirmados';
      return <li key={type} title={`${shortLabel}: ${state}`} className={`place-card-accessibility-badge ${supported.has(type) ? 'is-supported' : 'is-unavailable'}`}>
        <Icon size={20} aria-hidden="true" />
        <span className="sr-only">{shortLabel}: {state}</span>
      </li>;
    })}
  </ul>;
}
