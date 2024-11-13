import useSWR from "swr";
import type { Prompt } from "db/schema";

export function usePrompts() {
  const { data: prompts, error, mutate } = useSWR<Prompt[]>("/api/prompts");

  const createPrompt = async (prompt: Omit<Prompt, "id" | "userId">) => {
    await fetch("/api/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prompt),
    });
    mutate();
  };

  const updatePrompt = async (id: number, prompt: Partial<Prompt>) => {
    await fetch(`/api/prompts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prompt),
    });
    mutate();
  };

  const deletePrompt = async (id: number) => {
    await fetch(`/api/prompts/${id}`, { method: "DELETE" });
    mutate();
  };

  return {
    prompts,
    isLoading: !error && !prompts,
    isError: error,
    createPrompt,
    updatePrompt,
    deletePrompt,
  };
}
