import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getToken, setToken } from '../api/client';
import { authApi } from '../api/endpoints';
import type { User } from '../api/types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const USER_KEY = 'todo_user';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [user, setUser] = useState<User | null>(loadStoredUser());

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      login: async (email, password) => {
        const result = await authApi.login({ email, password });
        setToken(result.accessToken);
        setTokenState(result.accessToken);
        setUser(result.user);
      },
      register: async (name, email, password) => {
        await authApi.register({ name, email, password });
        const result = await authApi.login({ email, password });
        setToken(result.accessToken);
        setTokenState(result.accessToken);
        setUser(result.user);
      },
      logout: () => {
        setToken(null);
        setTokenState(null);
        setUser(null);
      },
    }),
    [user, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
