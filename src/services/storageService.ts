import { getSupabase } from '../lib/supabase';
import { DirectoryService } from './directoryService';
import { ContributionService, confirmedCriteria, localKey, PUBLIC_PLACE_COLUMNS, requireUser } from './contributionService';
import { normalizeSearchText } from '../utils/normalizeSearchText';
import { validateRegistration } from '../utils/registrationValidation';
import { browserStorage, readStoredArray } from '../lib/browserStorage';
import {
  Establishment,
  AccessibilityCriteria,
  Review,
  Professional,
  AccessibleRoute,
  DisabilityType,
  FilterState,
} from '../types';
import {
  MOCK_ESTABLISHMENTS,
  MOCK_CRITERIA,
  MOCK_REVIEWS,
  MOCK_PROFESSIONALS,
  MOCK_ROUTES,
} from '../data/mockData';

const STORAGE_KEYS = {
  ESTABLISHMENTS: 'acessacidade_establishments',
  CRITERIA: 'acessacidade_criteria',
  REVIEWS: 'acessacidade_reviews',
  PROFESSIONALS: 'acessacidade_professionals',
  ROUTES: 'acessacidade_routes',
};

// Grava os exemplos na primeira visita; nas seguintes, em dev, atualiza os exemplos já salvos
// e preserva o que o usuário cadastrou
const seedStorage = <T extends { id: string }>(key: string, mocks: T[]) => {
  if (!browserStorage.getItem(key)) {
    browserStorage.setItem(key, JSON.stringify(import.meta.env.DEV ? mocks : []));
  } else if (import.meta.env.DEV) {
    const seeded = new Map(mocks.map((item) => [item.id, item]));
    const stored = readStoredArray<T>(key, mocks);
    browserStorage.setItem(key, JSON.stringify(stored.map((item) => seeded.get(item.id) ?? item)));
  }
};

// Inicialização segura dos dados locais
const initStorage = () => {
  seedStorage(STORAGE_KEYS.ESTABLISHMENTS, MOCK_ESTABLISHMENTS);
  seedStorage(STORAGE_KEYS.CRITERIA, MOCK_CRITERIA);
  if (!browserStorage.getItem(STORAGE_KEYS.REVIEWS)) {
    browserStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(import.meta.env.DEV ? MOCK_REVIEWS : []));
  }
  seedStorage(STORAGE_KEYS.PROFESSIONALS, MOCK_PROFESSIONALS);
  seedStorage(STORAGE_KEYS.ROUTES, MOCK_ROUTES);
};

initStorage();
async function mergeCommunity(est: Establishment, original: AccessibilityCriteria[]) {
  const reports = await ContributionService.approved(localKey(est));
  const confirmed = confirmedCriteria(reports, est.id);
  const overridden = new Set(confirmed.map(c => c.recurso));
  return [...original.filter(c => !overridden.has(c.recurso)), ...confirmed];
}

export const StorageService = {
  // ESTABLISHMENTS
  getEstablishments: async (filters?: Partial<FilterState>): Promise<Establishment[]> => {
    const client = getSupabase();
    let establishments: Establishment[];
    if (client) {
      const { data, error } = await client.from('establishments').select(PUBLIC_PLACE_COLUMNS + ',criteria:accessibility_criteria(*),reviews(*)');
      if (error) throw new Error('Não foi possível carregar os locais. Tente novamente mais tarde.');
      establishments = data as unknown as Establishment[];
    } else establishments = readStoredArray<Establishment>(STORAGE_KEYS.ESTABLISHMENTS, import.meta.env.DEV ? MOCK_ESTABLISHMENTS : []);

    const allCriteria = readStoredArray<AccessibilityCriteria>(STORAGE_KEYS.CRITERIA, import.meta.env.DEV ? MOCK_CRITERIA : []);

    const allReviews = readStoredArray<Review>(STORAGE_KEYS.REVIEWS, import.meta.env.DEV ? MOCK_REVIEWS : []);

    // Attach criteria and reviews
    const fullEstablishments = await Promise.all(establishments.map(async (est) => ({
      ...est,
      criteria: await mergeCommunity(est, client ? est.criteria ?? [] : allCriteria.filter(c => c.establishment_id === est.id)),
      reviews: client ? est.reviews ?? [] : allReviews.filter((r) => r.establishment_id === est.id),
    })));

    if (!filters) return fullEstablishments;

    return fullEstablishments.filter((est) => {
      // Busca textual
      if (filters.searchQuery && filters.searchQuery.trim() !== '') {
        const q = normalizeSearchText(filters.searchQuery);
        const matchesName = normalizeSearchText(est.nome).includes(q);
        const matchesCategory = normalizeSearchText(est.categoria).includes(q);
        const matchesDesc = normalizeSearchText(est.descricao).includes(q);
        const matchesAddr = normalizeSearchText(est.endereco).includes(q) || (est.bairro && normalizeSearchText(est.bairro).includes(q)) || normalizeSearchText(est.cidade).includes(q);
        const matchesCriteria = est.criteria?.some((c) => normalizeSearchText(c.criterio).includes(q));

        if (!matchesName && !matchesCategory && !matchesDesc && !matchesAddr && !matchesCriteria) {
          return false;
        }
      }

      // Categoria
      if (filters.category && filters.category !== 'todas') {
        if (est.categoria !== filters.category) return false;
      }

      // Cidade
      if (filters.city && filters.city !== 'todas') {
        if (est.cidade !== filters.city) return false;
      }

      // Apenas verificados
      if (filters.onlyVerified) {
        if (est.status !== 'verificado') return false;
      }

      // Tipos de Deficiência selecionados (DEVE ter pelo menos um critério presente para CADA deficiência selecionada)
      if (filters.selectedDisabilities && filters.selectedDisabilities.length > 0) {
        const estDisabilityTypes = new Set(
          est.criteria?.filter((c) => c.presente).map((c) => c.tipo_deficiencia)
        );
        for (const reqDisability of filters.selectedDisabilities) {
          if (!estDisabilityTypes.has(reqDisability)) {
            return false;
          }
        }
      }

      return true;
    });
  },

  getEstablishmentById: async (id: string): Promise<Establishment | null> => {
    const list = await StorageService.getEstablishments();
    return list.find((e) => e.id === id) || null;
  },

  createEstablishment: async (
    data: Omit<Establishment, 'id' | 'nota_media' | 'total_avaliacoes' | 'status' | 'criado_em'>,
    criteriaList: Omit<AccessibilityCriteria, 'id' | 'establishment_id'>[]
  ): Promise<Establishment> => {
    validateRegistration(data);
    const client = getSupabase();
    if (client) {
      await requireUser();
      const { data: id, error } = await client.rpc('register_establishment', { details: JSON.parse(JSON.stringify(data)), criteria: JSON.parse(JSON.stringify(criteriaList)) });
      if (error) throw new Error(error.message);
      const saved = await StorageService.getEstablishmentById(id);
      if (!saved) throw new Error('Cadastro salvo, mas não foi possível carregá-lo.');
      return saved;
    }
    const establishments = readStoredArray<Establishment>(STORAGE_KEYS.ESTABLISHMENTS, []);

    if (establishments.filter(e => !e.id.startsWith('est-mock') && e.criado_em && Date.parse(e.criado_em) > Date.now() - 86400000).length >= 3) throw new Error('Limite de 3 cadastros em 24 horas atingido.');
    const newId = `est-${crypto.randomUUID()}`;
    const newEst: Establishment = {
      ...data,
      id: newId,
      status: 'pendente', // Comerciante cria em status pendente para moderação
      informado_responsavel: true,
      nota_media: 0,
      total_avaliacoes: 0,
      criado_em: new Date().toISOString(),
    };

    if (data.place_id && establishments.some(item => item.place_id === data.place_id)) {
      throw new Error('Este local já possui cadastro neste navegador.');
    }
    establishments.unshift(newEst);
    browserStorage.setItem(STORAGE_KEYS.ESTABLISHMENTS, JSON.stringify(establishments));

    // Salva critérios
    const allCriteria = readStoredArray<AccessibilityCriteria>(STORAGE_KEYS.CRITERIA, []);

    const newCriteria: AccessibilityCriteria[] = criteriaList.map((crit, idx) => ({
      ...crit,
      id: `cr-${newId}-${idx}`,
      establishment_id: newId,
    }));

    allCriteria.push(...newCriteria);
    browserStorage.setItem(STORAGE_KEYS.CRITERIA, JSON.stringify(allCriteria));

    newEst.criteria = newCriteria;
    newEst.reviews = [];
    return newEst;
  },

  // REVIEWS
  addReview: async (reviewData: {
    establishment_id: string;
    user_id?: string;
    user_nome: string;
    tipo_deficiencia_avaliada: DisabilityType;
    nota: number;
    comentario: string;
  }): Promise<Review> => {
    const client = getSupabase();
    if (client) {
      await requireUser();
      const { data, error } = await client.from('reviews').insert({ establishment_id: reviewData.establishment_id, tipo_deficiencia_avaliada: reviewData.tipo_deficiencia_avaliada, nota: reviewData.nota, comentario: reviewData.comentario }).select().single();
      if (error) throw new Error(error.message);
      return data as Review;
    }
    const reviews = readStoredArray<Review>(STORAGE_KEYS.REVIEWS, []);

    const newReview: Review = {
      ...reviewData,
      id: `rev-${crypto.randomUUID()}`,
      data: new Date().toISOString().split('T')[0],
      denunciada: false,
    };

    reviews.unshift(newReview);
    browserStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));

    // Recalcular nota média e total no estabelecimento
    const establishments = readStoredArray<Establishment>(STORAGE_KEYS.ESTABLISHMENTS, []);
    const estIndex = establishments.findIndex((e) => e.id === reviewData.establishment_id);

    if (estIndex >= 0) {
      const estReviews = reviews.filter((r) => r.establishment_id === reviewData.establishment_id);
      const total = estReviews.length;
      const sum = estReviews.reduce((acc, r) => acc + r.nota, 0);
      establishments[estIndex].total_avaliacoes = total;
      establishments[estIndex].nota_media = Number((sum / total).toFixed(1));
      browserStorage.setItem(STORAGE_KEYS.ESTABLISHMENTS, JSON.stringify(establishments));
    }

    return newReview;
  },

  reportReview: async (reviewId: string, motivo: string): Promise<void> => {
    const client = getSupabase();
    if (client) {
      await requireUser();
      const { error } = await client.from('review_flags').insert({ review_id: reviewId, motivo });
      if (error) throw new Error(error.code === '23505' ? 'Você já denunciou esta avaliação.' : 'Não foi possível registrar a denúncia.');
      return;
    }
    const reviews = readStoredArray<Review>(STORAGE_KEYS.REVIEWS, []);
    const idx = reviews.findIndex((r) => r.id === reviewId);
    if (idx >= 0) {
      reviews[idx].denunciada = true;
      reviews[idx].motivo_denuncia = motivo;
      browserStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    }
  },

  // PROFESSIONALS
  getProfessionals: async (
    especialidade?: string,
    tipoDeficiencia?: DisabilityType
  ): Promise<Professional[]> => {
    const list = getSupabase() ? await DirectoryService.professionals() : readStoredArray<Professional>(STORAGE_KEYS.PROFESSIONALS, import.meta.env.DEV ? MOCK_PROFESSIONALS : []);

    return list.filter((p) => {
      if (especialidade && especialidade !== 'todas') {
        if (!p.especialidade.toLowerCase().includes(especialidade.toLowerCase())) {
          return false;
        }
      }
      if (tipoDeficiencia) {
        if (!p.atende_por_tipo.includes(tipoDeficiencia)) {
          return false;
        }
      }
      return true;
    });
  },

  // ROUTES
  getRoutes: async (cidade?: string): Promise<AccessibleRoute[]> => {
    const list = getSupabase() ? await DirectoryService.routes() : readStoredArray<AccessibleRoute>(STORAGE_KEYS.ROUTES, import.meta.env.DEV ? MOCK_ROUTES : []);
    if (cidade && cidade !== 'todas') {
      return list.filter((r) => r.cidade.toLowerCase().includes(cidade.toLowerCase()));
    }
    return list;
  },

  saveRoute: async (route: Omit<AccessibleRoute, 'id'>): Promise<AccessibleRoute> => {
    if (getSupabase()) return DirectoryService.saveRoute(route);
    const list = readStoredArray<AccessibleRoute>(STORAGE_KEYS.ROUTES, import.meta.env.DEV ? MOCK_ROUTES : []);
    const saved = { ...route, id: `route-${crypto.randomUUID()}` };
    list.unshift(saved);
    browserStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(list));
    return saved;
  },

  saveProfessional: async (professional: Omit<Professional, 'id'>): Promise<Professional> => {
    if (getSupabase()) return DirectoryService.saveProfessional(professional);
    const list = readStoredArray<Professional>(STORAGE_KEYS.PROFESSIONALS, import.meta.env.DEV ? MOCK_PROFESSIONALS : []);
    const saved = { ...professional, id: `professional-${crypto.randomUUID()}` };
    list.unshift(saved);
    browserStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(list));
    return saved;
  },
};
