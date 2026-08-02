import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import {
  fetchMe,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
} from '../services/authService';
import { claimProject } from '../services/projectService';
import { ApiError } from '../services/apiClient';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  canAccessBuildPath: boolean;
  refresh: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  claimCurrentProject: (projectId: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const prevAccessRef = useRef<boolean | null>(null);

  const refresh = useCallback(async () => {
    const me = await fetchMe();
    setUser(me);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchMe();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    const next = Boolean(user?.canAccessBuildPath);
    if (prevAccessRef.current === false && next === true) {
      toast.success('Akun sudah Premium — silakan lanjut konsep rumah');
    }
    prevAccessRef.current = user ? next : null;
  }, [user, loading]);

  const login = useCallback(async (payload: LoginPayload) => {
    const next = await loginRequest(payload);
    setUser(next);
    return next;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const next = await registerRequest(payload);
    setUser(next);
    return next;
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
    prevAccessRef.current = null;
  }, []);

  const claimCurrentProject = useCallback(async (projectId: string) => {
    try {
      await claimProject(projectId);
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) return false;
      throw error;
    }
  }, []);

  const canAccessBuildPath = Boolean(user?.canAccessBuildPath);

  const value = useMemo(
    () => ({
      user,
      loading,
      canAccessBuildPath,
      refresh,
      login,
      register,
      logout,
      claimCurrentProject,
    }),
    [user, loading, canAccessBuildPath, refresh, login, register, logout, claimCurrentProject],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
