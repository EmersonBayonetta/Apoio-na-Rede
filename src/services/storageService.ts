import {
  Establishment,
  AccessibilityCriteria,
  Review,
  Professional,
  AccessibleRoute,
  User,
  DisabilityType,
  FilterState,
  EstablishmentStatus,
} from '../types';
import {
  MOCK_USERS,
  MOCK_ESTABLISHMENTS,
  MOCK_CRITERIA,
  MOCK_REVIEWS,
  MOCK_PROFESSIONALS,
  MOCK_ROUTES,
} from '../data/mockData';

const STORAGE_KEYS = {
  USERS: 'acessacidade_users',
  ESTABLISHMENTS: 'acessacidade_establishments',
  CRITERIA: 'acessacidade_criteria',
  REVIEWS: 'acessacidade_reviews',
  PROFESSIONALS: 'acessacidade_professionals',
  ROUTES: 'acessacidade_routes',
  CURRENT_USER_ID: 'acessacidade_current_user_id',
  ADMIN_SESSION_USER_ID: 'apoio_admin_session_user_id',
};

// Inicialização segura dos dados locais
const initStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_USERS));
  }
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
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'usr-1'); // Default: Ana Cadeirante
  }
};

initStorage();

const assertAdmin = () => {
  const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
  const users: User[] = rawUsers ? JSON.parse(rawUsers) : MOCK_USERS;
  const adminSessionId = sessionStorage.getItem(STORAGE_KEYS.ADMIN_SESSION_USER_ID);
  const actor = users.find((user) => user.id === adminSessionId);

  if (!actor || actor.tipo !== 'admin') {
    throw new Error('Acesso negado: esta ação exige perfil de administrador.');
  }
};

export const StorageService = {
  authenticateLocalAdmin: async (email: string, password: string): Promise<User> => {
    const expectedEmail = import.meta.env.VITE_LOCAL_ADMIN_EMAIL;
    const expectedPassword = import.meta.env.VITE_LOCAL_ADMIN_PASSWORD;

    if (!expectedEmail || !expectedPassword) {
      throw new Error('Credenciais administrativas não configuradas.');
    }
    const users = await StorageService.getUsers();
    const admin = users.find((user) => user.tipo === 'admin' && user.email.toLowerCase() === email.trim().toLowerCase());

    if (!admin || email.trim().toLowerCase() !== expectedEmail.toLowerCase() || password !== expectedPassword) {
      throw new Error('E-mail ou senha inválidos.');
    }

    sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION_USER_ID, admin.id);
    return admin;
  },

  getAdminSessionUser: async (): Promise<User | null> => {
    const sessionId = sessionStorage.getItem(STORAGE_KEYS.ADMIN_SESSION_USER_ID);
    if (!sessionId) return null;
    const users = await StorageService.getUsers();
    const admin = users.find((user) => user.id === sessionId && user.tipo === 'admin') || null;
    if (!admin) sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION_USER_ID);
    return admin;
  },

  clearAdminSession: async (): Promise<void> => {
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION_USER_ID);
  },

  // Resetar dados para o padrão de demonstração
  resetToDefaults: async () => {
    assertAdmin();
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_USERS));
    localStorage.setItem(STORAGE_KEYS.ESTABLISHMENTS, JSON.stringify(MOCK_ESTABLISHMENTS));
    localStorage.setItem(STORAGE_KEYS.CRITERIA, JSON.stringify(MOCK_CRITERIA));
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(MOCK_REVIEWS));
    localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(MOCK_PROFESSIONALS));
    localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(MOCK_ROUTES));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'usr-1');
  },

  // USERS
  getUsers: async (): Promise<User[]> => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : MOCK_USERS;
  },

  getCurrentUser: async (): Promise<User> => {
    const users = await StorageService.getUsers();
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'usr-1';
    return users.find((u) => u.id === currentId) || users[0];
  },

  setCurrentUser: async (userId: string): Promise<User> => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
    return StorageService.getCurrentUser();
  },

  updateUserPreferences: async (userId: string, preferences: DisabilityType[]): Promise<User> => {
    const users = await StorageService.getUsers();
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex >= 0) {
      users[userIndex].preferencias_acessibilidade = preferences;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      return users[userIndex];
    }
    throw new Error('Usuário não encontrado');
  },

  createUser: async (user: Omit<User, 'id'>): Promise<User> => {
    const users = await StorageService.getUsers();
    const newUser: User = {
      ...user,
      id: `usr-${Date.now()}`,
      criado_em: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);
    return newUser;
  },

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

  updateEstablishmentStatus: async (
    id: string,
    status: EstablishmentStatus,
    motivoRejeicao?: string
  ): Promise<Establishment> => {
    assertAdmin();
    const rawEst = localStorage.getItem(STORAGE_KEYS.ESTABLISHMENTS);
    const establishments: Establishment[] = rawEst ? JSON.parse(rawEst) : [];

    const index = establishments.findIndex((e) => e.id === id);
    if (index >= 0) {
      establishments[index].status = status;
      if (status === 'verificado') {
        establishments[index].verificado_em = new Date().toISOString().split('T')[0];
        delete establishments[index].motivo_rejeicao;
      } else if (status === 'rejeitado') {
        establishments[index].motivo_rejeicao = motivoRejeicao || 'Não atendeu aos critérios mínimos.';
      }
      localStorage.setItem(STORAGE_KEYS.ESTABLISHMENTS, JSON.stringify(establishments));
      return establishments[index];
    }
    throw new Error('Estabelecimento não encontrado');
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

  deleteReview: async (reviewId: string): Promise<void> => {
    assertAdmin();
    const rawRev = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    const reviews: Review[] = rawRev ? JSON.parse(rawRev) : [];
    const filtered = reviews.filter((r) => r.id !== reviewId);
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(filtered));
  },

  dismissReviewReport: async (reviewId: string): Promise<void> => {
    assertAdmin();
    const rawRev = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    const reviews: Review[] = rawRev ? JSON.parse(rawRev) : [];
    const review = reviews.find((item) => item.id === reviewId);
    if (!review) throw new Error('Avaliação não encontrada');
    review.denunciada = false;
    delete review.motivo_denuncia;
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
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
