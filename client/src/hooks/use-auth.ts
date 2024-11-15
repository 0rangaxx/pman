import { useState, useEffect, useCallback } from "react";
import { useLocalStorage } from "./use-local-storage";
import useSWR from "swr";
import type { User } from "db/schema";

interface AuthState {
  user: User | null;
  token: string | null;
}

export function useAuth() {
  const [{ user, token }, setAuthState] = useLocalStorage<AuthState>("auth", {
    user: null,
    token: null,
  });

  const { data: currentUser, mutate } = useSWR<User>(
    token ? "/api/user" : null,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Login failed");
      }

      const data = await response.json();
      setAuthState({ user: data.user, token: data.token });
      await mutate(data.user);
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, [setAuthState, mutate]);

  const register = useCallback(async (username: string, password: string) => {
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Registration failed");
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      setAuthState({ user: null, token: null });
      await mutate(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [setAuthState, mutate]);

  return {
    user: currentUser || user,
    isAuthenticated: !!token,
    login,
    logout,
    register,
  };
}
