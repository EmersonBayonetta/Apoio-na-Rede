import type { AccessibilityCriteria, DisabilityType } from '../types';

export const ACCESSIBILITY_RESOURCES = [
  { id: 'libras', label: 'Atendimento em Libras', legacy: 'Atendentes capacitados em Libras (Língua Brasileira de Sinais)', tipo: 'auditiva' },
  { id: 'entrada_acessivel', label: 'Entrada acessível', legacy: 'Entrada acessível sem degraus ou com acesso alternativo', tipo: 'mobilidade' },
  { id: 'rampa', label: 'Rampa', legacy: 'Rampa de acesso suave conforme NBR 9050 (sem degraus na entrada)', tipo: 'mobilidade' },
  { id: 'elevador', label: 'Elevador', legacy: 'Elevador acessível para cadeira de rodas', tipo: 'mobilidade' },
  { id: 'corrimao', label: 'Corrimão', legacy: 'Corrimão nas rampas e escadas', tipo: 'mobilidade' },
  { id: 'banheiro_pcd', label: 'Banheiro PCD', legacy: 'Banheiro adaptado com barras de apoio e espaço de giro de 1,50m', tipo: 'mobilidade' },
  { id: 'vaga_pcd', label: 'Vaga PCD', legacy: 'Vaga de estacionamento reservada e sinalizada em frente ao local', tipo: 'mobilidade' },
  { id: 'piso_tatil', label: 'Piso tátil', legacy: 'Piso tátil direcional e de alerta desde o acesso externo', tipo: 'visual' },
  { id: 'cadeira_rodas', label: 'Circulação em cadeira de rodas', legacy: 'Circulação interna acessível para cadeira de rodas', tipo: 'mobilidade' },
  { id: 'area_descanso', label: 'Área de descanso ou espaço tranquilo', legacy: 'Área de descanso ou espaço tranquilo para pausas', tipo: 'intelectual' },
  { id: 'iluminacao_ajustavel', label: 'Iluminação suave ou ajustável', legacy: 'Iluminação suave ou ajustável, sem luz intensa', tipo: 'intelectual' },
  { id: 'horario_tranquilo', label: 'Horário com menos estímulos', legacy: 'Horário com menos estímulos (menos som, luz e movimento)', tipo: 'intelectual' },
] as const satisfies readonly { id: string; label: string; legacy: string; tipo: DisabilityType }[];

export function resourceState(criteria: AccessibilityCriteria[], id: string): 'sim' | 'nao' | 'desconhecido' {
  const resource = ACCESSIBILITY_RESOURCES.find(item => item.id === id);
  const matches = criteria.filter(item => item.recurso === id || (!item.recurso && (item.criterio === resource?.legacy || (id === 'libras' && item.criterio === 'Atendente capacitado em Libras'))));
  const yes = matches.some(item => item.presente === true);
  const no = matches.some(item => item.presente === false);
  // Conflicting reports are not confirmation in either direction.
  return yes === no ? 'desconhecido' : yes ? 'sim' : 'nao';
}

export function registrationCriteriaTemplates(defaults: { tipo: DisabilityType; criterio: string }[]): { tipo: DisabilityType; criterio: string }[] {
  const extras = ACCESSIBILITY_RESOURCES.filter(resource => !defaults.some(item => item.criterio === resource.legacy));
  return [...defaults.map(({ tipo, criterio }) => ({ tipo, criterio })), ...extras.map(resource => ({ tipo: resource.tipo, criterio: resource.legacy }))];
}
