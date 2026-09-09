import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { apiGet, apiPost } from './api';

export type CurrentUser = {
  id: string;
  email: string;
  role: 'ADMIN' | 'ASSOCIATE';
  workspaceId: string;
};

export type LoginInput = {
  workspaceId: string;
  email: string;
  password: string;
};

type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; user: CurrentUser }
  | { status: 'unauthenticated' };

type AuthContextValue = {
  state: AuthState;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    apiGet<CurrentUser>('/auth/me')
      .then((user) => {
        if (!cancelled) {
          setState({ status: 'authenticated', user });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: 'unauthenticated' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const user = await apiPost<CurrentUser>('/auth/login', input);
    setState({ status: 'authenticated', user });
  }, []);

  const logout = useCallback(async () => {
    await apiPost('/auth/logout');
    setState({ status: 'unauthenticated' });
  }, []);

  return (
    <AuthContext.Provider value={{ state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
