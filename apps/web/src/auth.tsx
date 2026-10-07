import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { AuthResponse, LoginRequest, RegisterRequest, User } from "@studybuddy/shared";
import { apiRequest } from "./api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (input: LoginRequest) => Promise<void>;
  register: (input: RegisterRequest) => Promise<void>;
  updateUser: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("studybuddy-token")) {
      setLoading(false);
      return;
    }
    apiRequest<User>("/users/me")
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("studybuddy-token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const acceptAuth = useCallback((result: AuthResponse) => {
    localStorage.setItem("studybuddy-token", result.token);
    setUser(result.user);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (input) => acceptAuth(await apiRequest<AuthResponse>(
        "/auth/login",
        { method: "POST", body: JSON.stringify(input) },
        null
      )),
      register: async (input) => acceptAuth(await apiRequest<AuthResponse>(
        "/auth/register",
        { method: "POST", body: JSON.stringify(input) },
        null
      )),
      updateUser: setUser,
      logout: () => {
        localStorage.removeItem("studybuddy-token");
        setUser(null);
      }
    }),
    [acceptAuth, loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider.");
  }
  return context;
}
