import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, DisabilityType, UserRole } from '../types';
import { StorageService } from '../services/storageService';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  isLoading: boolean;
  switchUser: (userId: string) => Promise<void>;
  updateUserPreferences: (preferences: DisabilityType[]) => Promise<void>;
  loginAsNewUser: (nome: string, email: string, tipo: UserRole, preferencias: DisabilityType[]) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const users = await StorageService.getUsers();
      setAllUsers(users);
      const active = await StorageService.getCurrentUser();
      setCurrentUser(active);
    } catch (err) {
      console.error('Erro ao carregar usuário:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const switchUser = async (userId: string) => {
    const user = await StorageService.setCurrentUser(userId);
    setCurrentUser(user);
  };

  const updateUserPreferences = async (preferences: DisabilityType[]) => {
    if (!currentUser) return;
    const updated = await StorageService.updateUserPreferences(currentUser.id, preferences);
    setCurrentUser(updated);
    // Atualiza a lista geral de usuários
    const users = await StorageService.getUsers();
    setAllUsers(users);
  };

  const loginAsNewUser = async (
    nome: string,
    email: string,
    tipo: UserRole,
    preferencias: DisabilityType[]
  ): Promise<User> => {
    const newUser = await StorageService.createUser({
      nome,
      email,
      tipo,
      preferencias_acessibilidade: preferencias,
      bio: tipo === 'comerciante' ? 'Comerciante parceiro da acessibilidade' : 'Cidadão em busca de espaços acessíveis',
      avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250`,
    });
    setCurrentUser(newUser);
    const users = await StorageService.getUsers();
    setAllUsers(users);
    return newUser;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        isLoading,
        switchUser,
        updateUserPreferences,
        loginAsNewUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
