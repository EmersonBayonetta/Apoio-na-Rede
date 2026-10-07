import type { AccessibleRoute, DisabilityType, Establishment, EstablishmentCategory, Professional } from '../types';

// Exemplos locais de apresentação; nunca são enviados ao banco.
const categories: [EstablishmentCategory, string, string, string][] = [
  ['alimentacao', 'Café Horizonte', 'Cafeteria com mesas espaçosas, cardápio legível e atendimento tranquilo.', 'photo-1554118811-1e0d58224f24'],
  ['saude', 'Centro de Saúde Acolher', 'Consultórios com circulação ampla e recepção com assentos reservados.', 'photo-1519494026892-80bbd2d6fd0d'],
  ['lazer_cultura', 'Espaço Cultural Encontro', 'Exposições, oficinas e área de leitura com recursos de comunicação acessível.', 'photo-1565008447742-97f6f38c985c'],
  ['comercio_loja', 'Mercado Boa Praça', 'Loja com corredores largos, balcão baixo e sinalização de alto contraste.', 'photo-1542838132-92c53300491e'],
  ['servico_publico', 'Central de Atendimento Cidadão', 'Atendimento com senha visual, orientação individual e área de espera tranquila.', 'photo-1497366754035-f200968a6e72'],
  ['banheiro_adaptado', 'Sanitário Inclusivo Central', 'Sanitário ilustrativo com barras de apoio, área de giro e acesso sem degraus.', 'photo-1620626011761-996317b8d101'],
  ['educacao', 'Escola Caminhos', 'Salas com mobiliário ajustável, sinalização acessível e espaço para pausas.', 'photo-1503676260728-1c00da094a0b'],
  ['transporte_mobilidade', 'Terminal Integração', 'Área de embarque com assentos reservados e informações visuais de partidas.', 'photo-1544620347-c4fd4a3d5957'],
  ['hospedagem', 'Pousada Jardim Sereno', 'Quarto ilustrativo com acesso nivelado, banheiro adaptado e iluminação regulável.', 'photo-1566073771259-6a8506099945'],
];
const resources: [string, string, DisabilityType][] = [
  ['libras', 'Atendimento em Libras', 'auditiva'], ['entrada_acessivel', 'Entrada acessível', 'mobilidade'],
  ['rampa', 'Rampa', 'mobilidade'], ['elevador', 'Elevador', 'mobilidade'], ['corrimao', 'Corrimão', 'mobilidade'],
  ['banheiro_pcd', 'Banheiro PCD', 'mobilidade'], ['vaga_pcd', 'Vaga PCD', 'mobilidade'], ['piso_tatil', 'Piso tátil', 'visual'],
  ['cadeira_rodas', 'Circulação em cadeira de rodas', 'mobilidade'], ['area_descanso', 'Área de descanso ou espaço tranquilo', 'intelectual'],
  ['iluminacao_ajustavel', 'Iluminação suave ou ajustável', 'intelectual'], ['horario_tranquilo', 'Horário com menos estímulos', 'intelectual'],
];
export const PRESENTATION_PLACES: Establishment[] = categories.map(([categoria, nome, descricao, image], index) => {
  const id = `presentation-place-${index + 1}`;
  return { id, demonstracao: true, nome, categoria, descricao: `${descricao} Cadastro fictício: recursos, endereço e fotos são ilustrativos.`,
    endereco: `Rua Exemplo, ${100 + index * 10}`, bairro: 'Centro (ilustrativo)', cidade: 'Cataguases', estado: 'MG', cep: '36770-000',
    latitude: -21.3924 + index * .0001, longitude: -42.6896 + index * .0001,
    fotos: [`https://images.unsplash.com/${image}?auto=format&fit=crop&w=800&q=80`], status: 'pendente',
    telefone: 'Contato ilustrativo', whatsapp: 'Contato ilustrativo', email_contato: `exemplo${index + 1}@example.invalid`,
    website: 'https://example.invalid', horario_funcionamento: 'Segunda a sexta: 08h às 18h; sábado: 08h às 12h (ilustrativo)',
    nota_media: 0, total_avaliacoes: 0, criado_em: '2026-10-07',
    criteria: resources.map(([recurso, criterio, tipo_deficiencia], resourceIndex) => ({ id: `${id}-${recurso}`, establishment_id: id,
      recurso, criterio, tipo_deficiencia, presente: resourceIndex !== 3 && (resourceIndex + index) % 5 !== 0 })), reviews: [],
  };
});
const routeNames = [
  ['Praça Exemplo', 'Biblioteca Modelo'], ['Centro Cultural Modelo', 'Parque Exemplo'],
  ['Terminal Modelo', 'Centro de Atendimento Exemplo'], ['Escola Modelo', 'Praça Jardim Exemplo'], ['Mercado Modelo', 'Espaço de Saúde Exemplo'],
];
export const PRESENTATION_ROUTES: AccessibleRoute[] = routeNames.map(([ponto_origem, ponto_destino], index) => ({
  id: `presentation-route-${index + 1}`, demonstracao: true, titulo: `${ponto_origem} → ${ponto_destino}`, cidade: 'Cataguases',
  ponto_origem, ponto_destino, trecho_descricao: 'Exemplo de preenchimento: piso regular, travessias sinalizadas, espaço para circulação e pontos de descanso. As condições e os pontos não correspondem a um trajeto real.',
  tem_rampa: true, tem_piso_tatil: index % 2 === 0, tem_semaforo_sonoro: index === 0,
  nivel_seguranca: 'Condições ilustrativas — sem avaliação presencial', distancia_metros: 300 + index * 150,
  duracao_segundos: 360 + index * 180, coordenadas: [[-21.3924, -42.6896], [-21.3894 + index * .0001, -42.6876]], auditada: false, status: 'pendente',
}));
const specialties: [string, string, DisabilityType[]][] = [
  ['Ana Modelo', 'Fisioterapia e reabilitação motora', ['mobilidade', 'invisivel']],
  ['Bruno Modelo', 'Psicologia e acolhimento', ['intelectual', 'invisivel']],
  ['Clara Modelo', 'Fonoaudiologia e comunicação', ['auditiva', 'intelectual']],
  ['Daniel Modelo', 'Terapia ocupacional e autonomia', ['mobilidade', 'visual', 'intelectual']],
  ['Elisa Modelo', 'Odontologia e atendimento adaptado', ['mobilidade', 'auditiva', 'invisivel']],
  ['Felipe Modelo', 'Orientação e mobilidade visual', ['visual', 'mobilidade']],
];
export const PRESENTATION_PROFESSIONALS: Professional[] = specialties.map(([nome, especialidade, atende_por_tipo], index) => ({
  id: `presentation-professional-${index + 1}`, demonstracao: true, nome, especialidade, atende_por_tipo,
  registro_profissional: 'Registro ilustrativo — sem validade', endereco: `Avenida Modelo, ${200 + index * 20}, sala ${index + 1} — Centro (ilustrativo)`,
  cidade: 'Cataguases', estado: 'MG', telefone: 'Contato ilustrativo', whatsapp: 'Contato ilustrativo', email: `profissional${index + 1}@example.invalid`,
  descricao: 'Perfil fictício para apresentação. Exemplo de atendimento com agendamento, tempo ampliado, ambiente tranquilo e comunicação adaptada. Não representa um profissional ou serviço real.',
  foto_url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=400&q=80', status: 'pendente',
}));
