import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api from '../services/api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'student' | 'coordinator' | 'employer' | 'admin';
  studentId?: string;
  companyName?: string;
  phone?: string;
  isVerified: boolean;
  totpEnabled: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ requires2FA?: boolean; tempToken?: string }>;
  verify2FA: (tempToken: string, code: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string; studentId: string }) => Promise<void>;
  inviteSignup: (token: string, password: string) => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('csa_token'));
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem('csa_token');
    }
  }, []);

  useEffect(() => {
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, refreshUser]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.requires2FA) {
      return { requires2FA: true, tempToken: data.tempToken };
    }
    localStorage.setItem('csa_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return {};
  };

  const verify2FA = async (tempToken: string, code: string) => {
    const { data } = await api.post('/auth/verify-2fa', { tempToken, totpCode: code });
    localStorage.setItem('csa_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (regData: { email: string; password: string; fullName: string; studentId: string }) => {
    const { data } = await api.post('/auth/register', regData);
    localStorage.setItem('csa_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const inviteSignup = async (invToken: string, password: string) => {
    const { data } = await api.post('/auth/invite-signup', { token: invToken, password });
    localStorage.setItem('csa_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const verifyEmail = async (code: string) => {
    await api.post('/auth/verify-email', { code });
    await refreshUser();
  };

  const resendVerification = async () => {
    await api.post('/auth/resend-verification');
  };

  const logout = () => {
    localStorage.removeItem('csa_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, verify2FA, register, inviteSignup, verifyEmail, resendVerification, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
