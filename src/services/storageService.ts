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

// Inicialização segura dos dados locais
const initStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.ESTABLISHMENTS)) {
    localStorage.setItem(STORAGE_KEYS.ESTABLISHMENTS, JSON.stringify(MOCK_ESTABLISHMENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CRITERIA)) {
    localStorage.setItem(STORAGE_KEYS.CRITERIA, JSON.stringify(MOCK_CRITERIA));
  }
  if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(MOCK_REVIEWS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROFESSIONALS)) {
    localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(MOCK_PROFESSIONALS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ROUTES)) {
    localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(MOCK_ROUTES));
  }
};

initStorage();

export const StorageService = {
  // ESTABLISHMENTS
  getEstablishments: async (filters?: Partial<FilterState>): Promise<Establishment[]> => {
    const rawEst = localStorage.getItem(STORAGE_KEYS.ESTABLISHMENTS);
    const establishments: Establishment[] = rawEst ? JSON.parse(rawEst) : MOCK_ESTABLISHMENTS;

    const rawCrit = localStorage.getItem(STORAGE_KEYS.CRITERIA);
    const allCriteria: AccessibilityCriteria[] = rawCrit ? JSON.parse(rawCrit) : MOCK_CRITERIA;

    const rawRev = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    const allReviews: Review[] = rawRev ? JSON.parse(rawRev) : MOCK_REVIEWS;

    // Attach criteria and reviews
    const fullEstablishments = establishments.map((est) => ({
      ...est,
      criteria: allCriteria.filter((c) => c.establishment_id === est.id),
      reviews: allReviews.filter((r) => r.establishment_id === est.id),
    }));

    if (!filters) return fullEstablishments;

    return fullEstablishments.filter((est) => {
      // Busca textual
      if (filters.searchQuery && filters.searchQuery.trim() !== '') {
        const q = filters.searchQuery.toLowerCase();
        const matchesName = est.nome.toLowerCase().includes(q);
        const matchesCategory = est.categoria.toLowerCase().includes(q);
        const matchesDesc = est.descricao.toLowerCase().includes(q);
        const matchesAddr = est.endereco.toLowerCase().includes(q) || (est.bairro && est.bairro.toLowerCase().includes(q)) || est.cidade.toLowerCase().includes(q);
        const matchesCriteria = est.criteria?.some((c) => c.criterio.toLowerCase().includes(q));

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
    const rawEst = localStorage.getItem(STORAGE_KEYS.ESTABLISHMENTS);
    const establishments: Establishment[] = rawEst ? JSON.parse(rawEst) : [];

    const newId = `est-${Date.now()}`;
    const newEst: Establishment = {
      ...data,
      id: newId,
      status: 'pendente', // Comerciante cria em status pendente para moderação
      nota_media: 5.0,
      total_avaliacoes: 0,
      criado_em: new Date().toISOString(),
    };

    establishments.unshift(newEst);
    localStorage.setItem(STORAGE_KEYS.ESTABLISHMENTS, JSON.stringify(establishments));

    // Salva critérios
    const rawCrit = localStorage.getItem(STORAGE_KEYS.CRITERIA);
    const allCriteria: AccessibilityCriteria[] = rawCrit ? JSON.parse(rawCrit) : [];

    const newCriteria: AccessibilityCriteria[] = criteriaList.map((crit, idx) => ({
      ...crit,
      id: `cr-${newId}-${idx}`,
      establishment_id: newId,
    }));

    allCriteria.push(...newCriteria);
    localStorage.setItem(STORAGE_KEYS.CRITERIA, JSON.stringify(allCriteria));

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
    const rawRev = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    const reviews: Review[] = rawRev ? JSON.parse(rawRev) : [];

    const newReview: Review = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      data: new Date().toISOString().split('T')[0],
      denunciada: false,
    };

    reviews.unshift(newReview);
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));

    // Recalcular nota média e total no estabelecimento
    const rawEst = localStorage.getItem(STORAGE_KEYS.ESTABLISHMENTS);
    const establishments: Establishment[] = rawEst ? JSON.parse(rawEst) : [];
    const estIndex = establishments.findIndex((e) => e.id === reviewData.establishment_id);

    if (estIndex >= 0) {
      const estReviews = reviews.filter((r) => r.establishment_id === reviewData.establishment_id);
      const total = estReviews.length;
      const sum = estReviews.reduce((acc, r) => acc + r.nota, 0);
      establishments[estIndex].total_avaliacoes = total;
      establishments[estIndex].nota_media = Number((sum / total).toFixed(1));
      localStorage.setItem(STORAGE_KEYS.ESTABLISHMENTS, JSON.stringify(establishments));
    }

    return newReview;
  },

  reportReview: async (reviewId: string, motivo: string): Promise<void> => {
    const rawRev = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    const reviews: Review[] = rawRev ? JSON.parse(rawRev) : [];
    const idx = reviews.findIndex((r) => r.id === reviewId);
    if (idx >= 0) {
      reviews[idx].denunciada = true;
      reviews[idx].motivo_denuncia = motivo;
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    }
  },

  // PROFESSIONALS
  getProfessionals: async (
    especialidade?: string,
    tipoDeficiencia?: DisabilityType
  ): Promise<Professional[]> => {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFESSIONALS);
    const list: Professional[] = raw ? JSON.parse(raw) : MOCK_PROFESSIONALS;

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
    const raw = localStorage.getItem(STORAGE_KEYS.ROUTES);
    const list: AccessibleRoute[] = raw ? JSON.parse(raw) : MOCK_ROUTES;
    if (cidade && cidade !== 'todas') {
      return list.filter((r) => r.cidade.toLowerCase().includes(cidade.toLowerCase()));
    }
    return list;
  },
};
