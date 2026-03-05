"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("rag_token");
    if (savedToken) {
      setToken(savedToken);
      authAPI
        .me(savedToken)
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem("rag_token");
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authAPI.login({ email, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem("rag_token", newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const res = await authAPI.register({ email, password, name });
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem("rag_token", newToken);
      setToken(newToken);
      setUser(newUser);
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem("rag_token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
