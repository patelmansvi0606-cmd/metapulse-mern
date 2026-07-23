import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "../lib/api.js";
import { disconnectSocket } from "../lib/socket.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // 'loading' | 'authenticated' | 'anonymous'

  const refresh = useCallback(async () => {
    try {
      const { user } = await api.get("/auth/me");
      setUser(user);
      setStatus("authenticated");
    } catch {
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    const { user } = await api.post("/auth/login", { email, password });
    setUser(user);
    setStatus("authenticated");
  }, []);

  const signup = useCallback(async (email, password, fullName) => {
    const { user } = await api.post("/auth/signup", {
      email,
      password,
      fullName,
    });
    setUser(user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    disconnectSocket();
    setUser(null);
    setStatus("anonymous");
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
