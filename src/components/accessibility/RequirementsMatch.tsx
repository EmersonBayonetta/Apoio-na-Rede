import type { AccessibilityCriteria } from '../../types';
import { compareRequirements, compatibilityLabel, type RequirementItem, type RequirementProfile } from '../../utils/needsCompatibility';

// Receives the profile as a prop: map popups are rendered with renderToString, outside the context provider.
export function RequirementsMatch({ criteria, requirements }: { criteria?: AccessibilityCriteria[]; requirements: RequirementProfile }) {
  const match = compareRequirements(criteria, requirements);
  if (!match) return null;
  const groups: [string, RequirementItem[]][] = [['Atendidos', match.atendidos], ['Não atendidos', match.naoAtendidos], ['Sem informação', match.semInformacao]];
  return <section aria-label="Compatibilidade com seus requisitos" className="requirements-match space-y-2 rounded-xl border border-slate-200 p-3 text-xs">
    <p className="text-sm font-bold text-slate-900">{compatibilityLabel(match)}</p>
    {match.indispensaveisNaoAtendidos.map(label => <p key={label} className="rounded-lg bg-rose-50 p-2 font-semibold text-rose-900">Requisito indispensável não atendido: {label}</p>)}
    {groups.filter(([, items]) => items.length).map(([title, items]) => <div key={title}>
      <h4 className="font-semibold text-slate-800">{title}</h4>
      <ul className="list-disc pl-4 text-slate-700">{items.map(item => <li key={item.id}>{item.label}{item.level === 'indispensavel' ? ' (indispensável)' : ''}</li>)}</ul>
    </div>)}
    <p className="text-slate-500">Comparação com as informações cadastradas. Não é uma certificação de acessibilidade.</p>
  </section>;
}
