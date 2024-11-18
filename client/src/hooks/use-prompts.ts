import { useCallback, useState, useEffect } from "react";
import type { Prompt } from "db/schema";

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPrompts = useCallback(async () => {
    try {
      setIsRefreshing(true);
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
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const createPrompt = useCallback(async (prompt: Omit<Prompt, "id" | "createdAt" | "updatedAt" | "userId">) => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/prompts', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...prompt,
          isPrivate: prompt.isPrivate ?? false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create prompt');
      }

      const newPrompt = await response.json();
      
      // Update local state immediately for optimistic updates
      setPrompts(currentPrompts => [...currentPrompts, newPrompt]);
      
      // Refresh to ensure consistency
      await fetchPrompts();
      
      return newPrompt;
    } catch (error) {
      console.error('Error creating prompt:', error);
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchPrompts]);

  const updatePrompt = useCallback(async (id: number, promptUpdate: Partial<Prompt>) => {
    try {
      setIsRefreshing(true);
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

      // Update local state immediately for optimistic updates
      setPrompts(currentPrompts => {
        const index = currentPrompts.findIndex(p => p.id === id);
        if (index === -1) return currentPrompts;

        const newPrompts = [...currentPrompts];
        newPrompts[index] = { ...currentPrompts[index], ...updatedPrompt };
        return newPrompts;
      });

      // Refresh to ensure consistency
      await fetchPrompts();

      return updatedPrompt;
    } catch (error) {
      console.error('Error updating prompt:', error);
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchPrompts]);

  const deletePrompt = useCallback(async (id: number) => {
    try {
      setIsRefreshing(true);
      const response = await fetch(`/api/prompts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete prompt');
      }

      // Update local state immediately for optimistic updates
      setPrompts(currentPrompts =>
        currentPrompts.filter(prompt => prompt.id !== id)
      );

      // Refresh to ensure consistency
      await fetchPrompts();
    } catch (error) {
      console.error('Error deleting prompt:', error);
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchPrompts]);

  return {
    prompts,
    isLoading,
    isError,
    error,
    isRefreshing,
    createPrompt,
    updatePrompt,
    deletePrompt,
    refreshPrompts: fetchPrompts,
  };
}
