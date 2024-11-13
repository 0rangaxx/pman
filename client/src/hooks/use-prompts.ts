import useSWR from "swr";
import type { Prompt } from "db/schema";

export function usePrompts() {
  const { data: prompts, error, mutate } = useSWR<Prompt[]>("/api/prompts");

  const handleRequest = async (
    url: string,
    method: string,
    body?: any
  ): Promise<any> => {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "An error occurred");
    }

    return response.json();
  };

  const createPrompt = async (prompt: Omit<Prompt, "id">) => {
    try {
      await handleRequest("/api/prompts", "POST", prompt);
      await mutate();
    } catch (error) {
      console.error('Error creating prompt:', error);
      throw error;
    }
  };

  const updatePrompt = async (id: number, prompt: Partial<Prompt>) => {
    try {
      await handleRequest(`/api/prompts/${id}`, "PUT", prompt);
      await mutate();  // Force refresh after update
    } catch (error) {
      console.error('Error updating prompt:', error);
      throw error;
    }
  };

  const deletePrompt = async (id: number) => {
    try {
      await handleRequest(`/api/prompts/${id}`, "DELETE");
      await mutate();
    } catch (error) {
      console.error('Error deleting prompt:', error);
      throw error;
    }
  };

  return {
    prompts,
    isLoading: !error && !prompts,
    isError: error,
    error: error?.message,
    createPrompt,
    updatePrompt,
    deletePrompt,
  };
}
