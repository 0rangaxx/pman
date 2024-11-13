import { useCallback } from "react";
import { useLocalStorage } from "./use-local-storage";
import type { Prompt } from "db/schema";

export function usePrompts() {
  const [prompts, setPrompts] = useLocalStorage<Prompt[]>("prompts", []);
  
  const createPrompt = useCallback(async (prompt: Omit<Prompt, "id">) => {
    try {
      console.log('Creating prompt:', prompt);
      const newPrompt = {
        ...prompt,
        id: Date.now(),
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: prompt.tags || [],
        metadata: prompt.metadata || {},
      };
      
      setPrompts((currentPrompts) => {
        console.log('Current prompts:', currentPrompts);
        console.log('Adding new prompt:', newPrompt);
        return [...currentPrompts, newPrompt];
      });
      
      return newPrompt;
    } catch (error) {
      console.error('Error creating prompt:', error);
      throw error;
    }
  }, [setPrompts]);

  const updatePrompt = useCallback(async (id: number, promptUpdate: Partial<Prompt>) => {
    try {
      console.log('Updating prompt:', { id, promptUpdate });
      let updatedPrompt: Prompt;
      
      setPrompts((currentPrompts) => {
        const index = currentPrompts.findIndex((p) => p.id === id);
        if (index === -1) {
          console.error('Prompt not found:', id);
          throw new Error("Prompt not found");
        }

        const updatedPrompts = [...currentPrompts];
        updatedPrompt = {
          ...updatedPrompts[index],
          ...promptUpdate,
          updatedAt: new Date(),
        };
        updatedPrompts[index] = updatedPrompt;
        
        console.log('Updated prompts:', updatedPrompts);
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
      console.log('Deleting prompt:', id);
      setPrompts((currentPrompts) => {
        console.log('Current prompts:', currentPrompts);
        const filteredPrompts = currentPrompts.filter((prompt) => prompt.id !== id);
        console.log('Remaining prompts:', filteredPrompts);
        return filteredPrompts;
      });
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
