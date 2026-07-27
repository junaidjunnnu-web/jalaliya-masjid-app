import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken, clearToken } from './api';

interface User {
  id: number;
  phone: string;
  role: 'committee' | 'member';
  familyId?: number;
  committeeMemberId?: number;
}

interface AuthContextType {
  user: User | null;
  family: any;
  committeeMember: any;
  loading: boolean;
  login: (phone: string, pin: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [family, setFamily] = useState<any>(null);
  const [committeeMember, setCommitteeMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data } = await api.auth.me();
    if (data) {
      setUser(data.user);
      setFamily(data.family);
      setCommitteeMember(data.committeeMember);
    }
    setLoading(false);
  };

  const login = async (phone: string, pin: string): Promise<boolean> => {
    const { data, error } = await api.auth.login(phone, pin);
    if (data) {
      setToken(data.token);
      setUser(data.user);
      return true;
    }
    return false;
  };

  const register = async (data: any): Promise<boolean> => {
    const { data: result, error } = await api.auth.register(data);
    if (result) {
      setToken(result.token);
      setUser(result.user);
      setFamily(result.family);
      return true;
    }
    return false;
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setFamily(null);
    setCommitteeMember(null);
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        family,
        committeeMember,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
