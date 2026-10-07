import { ACCESSIBILITY_RESOURCES } from '../data/accessibilityResources.ts';
import type { AccessibilityCriteria } from '../types';

export interface ConfirmationReport { status: string; respostas: Record<string, string> }
export function confirmedCriteria(reports: ConfirmationReport[], establishmentId: string): AccessibilityCriteria[] {
  return ACCESSIBILITY_RESOURCES.flatMap(resource => {
    const values = reports.filter(r => r.status === 'aprovado').map(r => r.respostas[resource.id]);
    const yes = values.filter(v => v === 'sim').length;
    const no = values.filter(v => v === 'nao').length;
    if (yes < 3 && no < 3 && !(yes > 0 && no > 0)) return [];
    return [{ id: `community-${resource.id}`, establishment_id: establishmentId, recurso: resource.id,
      tipo_deficiencia: resource.tipo, criterio: resource.legacy, presente: yes > 0 && no > 0 ? null : yes >= 3,
      observacao_livre: yes > 0 && no > 0 ? 'Há relatos divergentes; falta confirmação.' : 'Confirmado por pelo menos 3 relatos aprovados.' }];
  });
}
