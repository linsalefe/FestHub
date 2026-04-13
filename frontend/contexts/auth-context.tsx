"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  tenant_id: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("festhub_token");
    if (token) {
      api
        .get("/api/auth/me")
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem("festhub_token");
          localStorage.removeItem("festhub_user");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/api/auth/login", { email, password });
    localStorage.setItem("festhub_token", res.data.access_token);
    localStorage.setItem("festhub_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("festhub_token");
    localStorage.removeItem("festhub_user");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
