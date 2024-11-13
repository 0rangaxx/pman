import useSWR from "swr";
import type { GoogleUser } from "../types/google";

export function useUser() {
  const { data: user, error, mutate } = useSWR<GoogleUser>("/api/user");

  return {
    user,
    isLoading: !error && !user,
    isError: error,
    mutate,
  };
}
