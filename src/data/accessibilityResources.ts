import type { AccessibilityCriteria, DisabilityType } from '../types';

interface AccessibilityResource {
  id: string;
  label: string;
  // Stored as `criterio`; also explains the resource in the registration form.
  legacy: string;
  tipo: DisabilityType;
  // Older criterio texts that mean the same resource.
  aliases?: readonly string[];
}

// Single source for registration, place cards, the place summary and user requirements.
export const ACCESSIBILITY_RESOURCES = [
  { id: 'entrada_acessivel', label: 'Entrada acessível', legacy: 'Entrada acessível sem degraus ou com acesso alternativo', tipo: 'mobilidade' },
  { id: 'rampa', label: 'Rampa', legacy: 'Rampa de acesso com inclinação suave conforme NBR 9050', tipo: 'mobilidade',
    aliases: ['Rampa de acesso suave conforme NBR 9050 (sem degraus na entrada)'] },
  { id: 'elevador', label: 'Elevador', legacy: 'Elevador acessível para cadeira de rodas', tipo: 'mobilidade' },
  { id: 'corrimao', label: 'Corrimão', legacy: 'Corrimão nas rampas e escadas', tipo: 'mobilidade' },
  { id: 'cadeira_rodas', label: 'Circulação em cadeira de rodas', legacy: 'Circulação interna acessível para cadeira de rodas, com portas e corredores de pelo menos 90 cm', tipo: 'mobilidade',
    aliases: ['Circulação interna acessível para cadeira de rodas', 'Portas e corredores com largura mínima de 90cm'] },
  { id: 'balcao_acessivel', label: 'Balcão ou mesa acessível', legacy: 'Mesas e balcões com altura acessível para cadeira de rodas', tipo: 'mobilidade' },
  { id: 'banheiro_pcd', label: 'Banheiro PCD', legacy: 'Banheiro adaptado com barras de apoio e espaço de giro de 1,50m', tipo: 'mobilidade' },
  { id: 'vaga_pcd', label: 'Vaga PCD', legacy: 'Vaga de estacionamento reservada e sinalizada em frente ao local', tipo: 'mobilidade' },
  { id: 'piso_tatil', label: 'Piso tátil', legacy: 'Piso tátil direcional e de alerta desde o acesso externo', tipo: 'visual' },
  { id: 'braille', label: 'Material em Braille ou digital acessível', legacy: 'Cardápio / Material em Braille e versão digital acessível por QR Code', tipo: 'visual' },
  { id: 'cao_guia', label: 'Cão-guia aceito', legacy: 'Cão-guia aceito com bebedouro e espaço seguro', tipo: 'visual' },
  { id: 'alto_contraste', label: 'Sinalização em alto contraste', legacy: 'Sinalização em alto contraste e boa iluminação uniforme', tipo: 'visual' },
  { id: 'libras', label: 'Atendimento em Libras', legacy: 'Atendentes capacitados em Libras (Língua Brasileira de Sinais)', tipo: 'auditiva',
    aliases: ['Atendente capacitado em Libras'] },
  { id: 'alertas_visuais', label: 'Alertas visuais', legacy: 'Alertas e avisos visuais ou luminosos para chamadas e emergência', tipo: 'auditiva' },
  { id: 'linguagem_simples', label: 'Linguagem simples e pictogramas', legacy: 'Linguagem simples, sinalização pictográfica e fotos reais no cardápio', tipo: 'intelectual' },
  { id: 'equipe_acolhimento', label: 'Equipe preparada para acolhimento', legacy: 'Equipe treinada para acolhimento de pessoas autistas e neurodivergentes', tipo: 'intelectual' },
  { id: 'area_descanso', label: 'Área de descanso ou espaço tranquilo', legacy: 'Área de descanso ou espaço tranquilo para pausas', tipo: 'intelectual',
    aliases: ['Espaço confortável para descanso e hidratação'] },
  { id: 'iluminacao_ajustavel', label: 'Iluminação suave ou ajustável', legacy: 'Iluminação suave ou ajustável, sem luz intensa', tipo: 'intelectual' },
  { id: 'horario_tranquilo', label: 'Horário com menos estímulos', legacy: 'Horário com menos estímulos (menos som, luz e movimento)', tipo: 'intelectual' },
  { id: 'cordao_girassol', label: 'Cordão de Girassol reconhecido', legacy: 'Atendimento prioritário para portadores de Cordão de Girassol sem constrangimento', tipo: 'invisivel',
    aliases: ['Atendimento prioritário para portadores de Cordão de Girassol'] },
] as const satisfies readonly AccessibilityResource[];

// Community reports are limited by the database to these answers (see database/contribution_indexes.sql).
const CONTRIBUTION_RESOURCE_IDS: readonly string[] = ['libras', 'entrada_acessivel', 'rampa', 'elevador', 'corrimao', 'banheiro_pcd', 'vaga_pcd', 'piso_tatil', 'cadeira_rodas', 'area_descanso', 'iluminacao_ajustavel', 'horario_tranquilo'];
export const CONTRIBUTION_RESOURCES = ACCESSIBILITY_RESOURCES.filter(resource => CONTRIBUTION_RESOURCE_IDS.includes(resource.id));

const describes = (resource: AccessibilityResource, text: string) => text === resource.legacy || Boolean(resource.aliases?.includes(text));

export function resourceForCriterion(criterion: Pick<AccessibilityCriteria, 'recurso' | 'criterio'>) {
  return ACCESSIBILITY_RESOURCES.find(resource => criterion.recurso ? criterion.recurso === resource.id : describes(resource, criterion.criterio));
}

export function resourceState(criteria: AccessibilityCriteria[], id: string): 'sim' | 'nao' | 'desconhecido' {
  const matches = criteria.filter(item => resourceForCriterion(item)?.id === id);
  const yes = matches.some(item => item.presente === true);
  const no = matches.some(item => item.presente === false);
  // Conflicting reports are not confirmation in either direction.
  return yes === no ? 'desconhecido' : yes ? 'sim' : 'nao';
}
