import { useCallback, useState, useEffect } from "react";
import type { Prompt } from "db/schema";

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompts = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      const response = await fetch('/api/prompts', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch prompts');
      }

      const data = await response.json();
      setPrompts(data);
    } catch (error) {
      console.error('Error fetching prompts:', error);
      setIsError(true);
      setError(error instanceof Error ? error.message : 'Failed to fetch prompts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const createPrompt = useCallback(async (prompt: Omit<Prompt, "id" | "createdAt" | "updatedAt" | "userId">) => {
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...prompt,
          isPrivate: prompt.isPrivate ?? false, // デフォルトは公開
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create prompt');
      }

      const newPrompt = await response.json();
      setPrompts(currentPrompts => [...currentPrompts, newPrompt]);
      return newPrompt;
    } catch (error) {
      console.error('Error creating prompt:', error);
      throw error;
    }
  }, []);

  const updatePrompt = useCallback(async (id: number, promptUpdate: Partial<Prompt>) => {
    try {
      const response = await fetch(`/api/prompts/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptUpdate),
      });

      if (!response.ok) {
        throw new Error('Failed to update prompt');
      }

      const updatedPrompt = await response.json();

      // Completely replace the prompt in the list
      setPrompts(currentPrompts => {
        const index = currentPrompts.findIndex(p => p.id === id);
        if (index === -1) return currentPrompts;

        const newPrompts = [...currentPrompts];
        newPrompts[index] = { ...currentPrompts[index], ...updatedPrompt };
        return newPrompts;
      });

      return updatedPrompt;
    } catch (error) {
      console.error('Error updating prompt:', error);
      throw error;
    }
  }, []);

  const deletePrompt = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/api/prompts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete prompt');
      }

      setPrompts(currentPrompts =>
        currentPrompts.filter(prompt => prompt.id !== id)
      );
    } catch (error) {
      console.error('Error deleting prompt:', error);
      throw error;
    }
  }, []);

  return {
    prompts,
    isLoading,
    isError,
    error,
    createPrompt,
    updatePrompt,
    deletePrompt,
    refreshPrompts: fetchPrompts,
  };
}
