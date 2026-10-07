import { Accessibility, ArrowUpDown, Clock3, DoorOpen, Fence, Footprints, Hand, ParkingSquare, Sofa, SunDim, Toilet, TrendingUp } from 'lucide-react';
import type { Establishment } from '../../types';
import { ACCESSIBILITY_RESOURCES, resourceState } from '../../data/accessibilityResources';
import { DISABILITY_INFO } from './DisabilityBadge';

const resourceIcons = {
  libras: Hand,
  entrada_acessivel: DoorOpen,
  rampa: TrendingUp,
  elevador: ArrowUpDown,
  corrimao: Fence,
  banheiro_pcd: Toilet,
  vaga_pcd: ParkingSquare,
  piso_tatil: Footprints,
  cadeira_rodas: Accessibility,
  area_descanso: Sofa,
  iluminacao_ajustavel: SunDim,
  horario_tranquilo: Clock3,
};

const MAX_VISIBLE = 4;
const tile = 'flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800';

export function AccessibilityIcons({ establishment }: { establishment: Establishment }) {
  const criteria = establishment.criteria ?? [];
  const resources = ACCESSIBILITY_RESOURCES.filter(resource => resourceState(criteria, resource.id) === 'sim')
    .map(resource => ({ id: resource.id, label: resource.label, Icon: resourceIcons[resource.id] }));
  // Older records describe criteria in free text, so fall back to the needs they cover.
  const items = resources.length ? resources : [...new Set(criteria.filter(item => item.presente).map(item => item.tipo_deficiencia))]
    .map(type => ({ id: type, label: DISABILITY_INFO[type].label, Icon: DISABILITY_INFO[type].icon }));

  if (!items.length) return <p className="text-sm text-slate-600">Recursos ainda não informados</p>;

  const hidden = items.slice(MAX_VISIBLE);
  return <ul className="flex flex-wrap gap-1.5" aria-label={resources.length ? 'Recursos de acessibilidade cadastrados como disponíveis' : 'Necessidades atendidas segundo o cadastro'}>
    {items.slice(0, MAX_VISIBLE).map(({ id, label, Icon }) => <li key={id} title={label} className={tile}>
      <Icon size={18} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </li>)}
    {hidden.length > 0 && <li title={hidden.map(item => item.label).join(', ')} className={`${tile} text-xs font-bold`}>
      <span aria-hidden="true">+{hidden.length}</span>
      <span className="sr-only">{hidden.map(item => item.label).join(', ')}</span>
    </li>}
  </ul>;
}
