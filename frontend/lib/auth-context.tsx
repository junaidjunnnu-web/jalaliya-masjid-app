import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken, clearToken } from './api';
import { useRouter } from 'expo-router';

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
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data, error } = await api.auth.me();
      if (data && data.user) {
        setUser(data.user);
        setFamily(data.family || null);
        setCommitteeMember(data.committeeMember || null);
        console.log('🔄 AUTH CHECK SUCCESS:', {
          userId: data.user.id,
          phone: data.user.phone,
          role: data.user.role,
          familyId: data.user.familyId,
          committeeMemberId: data.user.committeeMemberId,
        });
      } else if (error) {
        // Invalid or expired token - clear it
        console.log('⚠️ AUTH CHECK FAILED - clearing token:', error);
        await clearToken();
        setUser(null);
        setFamily(null);
        setCommitteeMember(null);
      }
    } catch (error) {
      console.error('❌ AUTH CHECK ERROR:', error);
      await clearToken();
      setUser(null);
      setFamily(null);
      setCommitteeMember(null);
    }
    setLoading(false);
  };

  const login = async (phone: string, pin: string): Promise<boolean> => {
    try {
      const { data, error } = await api.auth.login(phone, pin);
      if (data && data.token && data.user) {
        await setToken(data.token);
        setUser(data.user);
        setFamily(data.family || null);
        setCommitteeMember(data.committeeMember || null);
        console.log('🔐 LOGIN SUCCESS:', {
          userId: data.user.id,
          phone: data.user.phone,
          role: data.user.role,
          familyId: data.user.familyId,
          committeeMemberId: data.user.committeeMemberId,
        });
        router.replace('/(tabs)');
        return true;
      }
      console.log('❌ LOGIN FAILED:', error);
      return false;
    } catch (error) {
      console.error('❌ LOGIN ERROR:', error);
      return false;
    }
  };

  const register = async (data: any): Promise<boolean> => {
    try {
      const { data: result, error } = await api.auth.register(data);
      if (result && result.token && result.user) {
        await setToken(result.token);
        setUser(result.user);
        setFamily(result.family || null);
        setCommitteeMember(result.committeeMember || null);
        console.log('📝 REGISTER SUCCESS:', {
          userId: result.user.id,
          phone: result.user.phone,
          role: result.user.role,
          familyId: result.user.familyId,
        });
        router.replace('/(tabs)');
        return true;
      }
      console.log('❌ REGISTER FAILED:', error);
      return false;
    } catch (error) {
      console.error('❌ REGISTER ERROR:', error);
      return false;
    }
  };

  const logout = async () => {
    console.log('🚪 LOGOUT - clearing session');
    await clearToken();
    setUser(null);
    setFamily(null);
    setCommitteeMember(null);
    router.replace('/auth/login');
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
