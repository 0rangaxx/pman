import { useCallback } from "react";
import { useLocalStorage } from "./use-local-storage";
import type { Prompt } from "db/schema";

export function usePrompts() {
  const [prompts, setPrompts] = useLocalStorage<Prompt[]>("prompts", []);
  
  const createPrompt = useCallback(async (prompt: Omit<Prompt, "id">) => {
    try {
      const newPrompt = {
        ...prompt,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: prompt.tags || [],
        metadata: prompt.metadata || {},
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
      let updatedPrompt: Prompt | undefined;
      setPrompts((currentPrompts) => {
        const index = currentPrompts.findIndex((p) => p.id === id);
        if (index === -1) throw new Error("Prompt not found");

        const updatedPrompts = [...currentPrompts];
        updatedPrompt = {
          ...updatedPrompts[index],
          ...promptUpdate,
          updatedAt: new Date().toISOString(),
        };
        updatedPrompts[index] = updatedPrompt;
        return updatedPrompts;
      });
      return updatedPrompt!;
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
    isLoading: false,
    isError: false,
    error: null,
    createPrompt,
    updatePrompt,
    deletePrompt,
  };
}
