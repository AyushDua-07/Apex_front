import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { loginUser, registerUser, getMe } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('apex_token'));
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const storedToken = localStorage.getItem('apex_token');
    if (storedToken) {
      try {
        const res = await getMe();
        setUser(res.data);
        setToken(storedToken);
      } catch {
        localStorage.removeItem('apex_token');
        localStorage.removeItem('apex_user');
        setUser(null);
        setToken(null);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const res = await loginUser({ email, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('apex_token', newToken);
    localStorage.setItem('apex_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const register = async (data: Record<string, unknown>) => {
    const res = await registerUser(data);
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('apex_token', newToken);
    localStorage.setItem('apex_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('apex_token');
    localStorage.removeItem('apex_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
