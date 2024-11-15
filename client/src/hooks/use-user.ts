import useSWR from "swr";
import { useCallback } from "react";
import type { User } from "db/schema";

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData extends LoginData {
  name: string;
}

interface UseUser {
  user: User | null | undefined;
  isLoading: boolean;
  isError: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

export function useUser(): UseUser {
  const { data: user, error, mutate } = useSWR<User | null>("/api/auth/user", {
    onSuccess: (data) => {
      console.log('User data fetched:', data ? 'authenticated' : 'not authenticated');
    },
    onError: (err) => {
      console.error('Error fetching user:', err);
    }
  });

  console.log('useUser hook state:', { user, isLoading: !error && !user, isError: !!error });

  const login = useCallback(
    async (data: LoginData) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Login failed");
      }

      const userData = await response.json();
      await mutate(userData);
    },
    [mutate]
  );

  const register = useCallback(
    async (data: RegisterData) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registration failed");
      }

      const userData = await response.json();
      await mutate(userData);
    },
    [mutate]
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await mutate(null);
  }, [mutate]);

  return {
    user,
    isLoading: !error && !user,
    isError: !!error,
    login,
    register,
    logout,
  };
}
