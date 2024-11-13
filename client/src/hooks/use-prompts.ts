import { useCallback } from "react";
import { useLocalStorage } from "./use-local-storage";
import type { Prompt } from "db/schema";

export function usePrompts() {
  const [prompts, setPrompts] = useLocalStorage<Prompt[]>("prompts", []);
  
  const createPrompt = useCallback(async (prompt: Omit<Prompt, "id">) => {
    try {
      const newPrompt = {
        ...prompt,
        id: Date.now(), // Use timestamp as a simple unique id
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPrompts((currentPrompts) => [...currentPrompts, newPrompt]);
      return newPrompt;
    } catch (error) {
      console.error('Error creating prompt:', error);
      throw error;
    }
  }, [setPrompts]);

  const updatePrompt = useCallback(async (id: number, promptUpdate: Partial<Prompt>) => {
    try {
      setPrompts((currentPrompts) => {
        const index = currentPrompts.findIndex((p) => p.id === id);
        if (index === -1) return currentPrompts;

        const updatedPrompts = [...currentPrompts];
        updatedPrompts[index] = {
          ...updatedPrompts[index],
          ...promptUpdate,
          updatedAt: new Date().toISOString(),
        };
        return updatedPrompts;
      });
    } catch (error) {
      console.error('Error updating prompt:', error);
      throw error;
    }
  }, [setPrompts]);

  const deletePrompt = useCallback(async (id: number) => {
    try {
      setPrompts((currentPrompts) => 
        currentPrompts.filter((prompt) => prompt.id !== id)
      );
    } catch (error) {
      console.error('Error deleting prompt:', error);
      throw error;
    }
  }, [setPrompts]);

  return {
    prompts,
    isLoading: false, // Local storage is synchronous
    isError: false,
    error: null,
    createPrompt,
    updatePrompt,
    deletePrompt,
  };
}
