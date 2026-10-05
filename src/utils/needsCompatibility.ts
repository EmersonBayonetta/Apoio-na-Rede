import type { AccessibilityCriteria } from '../types';
import { ACCESSIBILITY_RESOURCES, resourceState } from '../data/accessibilityResources.ts';

export type ResourceId = typeof ACCESSIBILITY_RESOURCES[number]['id'];
export type RequirementLevel = 'indispensavel' | 'desejavel';
export type RequirementProfile = Partial<Record<ResourceId, RequirementLevel>>;
export interface RequirementItem { id: ResourceId; label: string; level: RequirementLevel }
export interface RequirementMatch {
  total: number;
  atendidos: RequirementItem[];
  naoAtendidos: RequirementItem[];
  semInformacao: RequirementItem[];
  indispensaveisNaoAtendidos: string[];
}

// Unknown resources and levels are dropped, which leaves them as "Não preciso".
export function parseRequirementProfile(raw: string | null): RequirementProfile {
  try {
    const value: unknown = raw ? JSON.parse(raw) : {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(ACCESSIBILITY_RESOURCES.flatMap(resource => {
      const level = (value as Record<string, unknown>)[resource.id];
      return level === 'indispensavel' || level === 'desejavel' ? [[resource.id, level]] : [];
    }));
  } catch {
    return {};
  }
}

export function compareRequirements(criteria: AccessibilityCriteria[] | undefined, profile: RequirementProfile): RequirementMatch | null {
  const items = ACCESSIBILITY_RESOURCES.flatMap(resource => {
    const level = profile[resource.id];
    return level ? [{ item: { id: resource.id, label: resource.label, level }, state: resourceState(criteria ?? [], resource.id) }] : [];
  });
  if (!items.length) return null;
  const withState = (state: string) => items.filter(entry => entry.state === state).map(entry => entry.item);
  const naoAtendidos = withState('nao');
  return {
    total: items.length,
    atendidos: withState('sim'),
    naoAtendidos,
    semInformacao: withState('desconhecido'),
    indispensaveisNaoAtendidos: naoAtendidos.filter(item => item.level === 'indispensavel').map(item => item.label),
  };
}

export function compatibilityLabel(match: RequirementMatch): string {
  return `Atende ${match.atendidos.length} de ${match.total} requisitos`;
}

export function hasUnmetEssential(criteria: AccessibilityCriteria[] | undefined, profile: RequirementProfile): boolean {
  return Boolean(compareRequirements(criteria, profile)?.indispensaveisNaoAtendidos.length);
}
