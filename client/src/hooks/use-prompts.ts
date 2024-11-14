import { useCallback, useState, useEffect } from "react";
import { useLocalStorage } from "./use-local-storage";
import type { Prompt } from "db/schema";
// Removed sanitize functions, as they are not needed in storage operations anymore.
// export function usePrompts() { ... 

export function usePrompts() {
  const [prompts, setPrompts] = useLocalStorage<Prompt[]>("prompts", []);
  const [version, setVersion] = useState(0);

  const refreshPrompts = useCallback(() => {
    console.log('Forcing prompts refresh');
    setVersion(v => v + 1);
  }, []);

  // Force re-fetch when version changes, but avoid infinite loops
  useEffect(() => {
    const stored = window.localStorage.getItem("prompts");
    if (stored) {
      try {
        const parsedPrompts = JSON.parse(stored);
        // Only update if the stored data is different
        if (JSON.stringify(parsedPrompts) !== JSON.stringify(prompts)) {
          console.log('Refreshing prompts from storage');
          setPrompts(parsedPrompts);
        }
      } catch (error) {
        console.error('Error parsing stored prompts:', error);
      }
    }
  }, [version, setPrompts]); // Remove prompts from dependency array to prevent infinite loops

  const createPrompt = useCallback(async (prompt: Omit<Prompt, "id">) => {
    try {
      console.log('Creating prompt:', prompt);
      // const sanitizedPrompt = { ... };  // Removed sanitization
      const newPrompt: Prompt = {
        ...prompt,
        id: Date.now(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setPrompts((currentPrompts) => {
        console.log('Current prompts:', currentPrompts);
        console.log('Adding new prompt:', newPrompt);
        return [...currentPrompts, newPrompt];
      });
      
      refreshPrompts();
      return newPrompt;
    } catch (error) {
      console.error('Error creating prompt:', error);
      throw error;
    }
  }, [setPrompts, refreshPrompts]);

  const updatePrompt = useCallback(async (id: number, promptUpdate: Partial<Prompt>) => {
    try {
      console.log('Updating prompt:', { id, promptUpdate });
      // const sanitizedUpdate = { ... };  // Removed sanitization
      let updatedPrompt: Prompt;
      
      setPrompts((currentPrompts) => {
        const newPrompts = [...currentPrompts];
        const index = newPrompts.findIndex((p) => p.id === id);
        if (index === -1) {
          console.error('Prompt not found:', id);
          throw new Error("Prompt not found");
        }

        updatedPrompt = {
          ...newPrompts[index],
          ...promptUpdate,
          updatedAt: new Date(),
        };
        newPrompts[index] = updatedPrompt;
        
        console.log('Updated prompts:', newPrompts);
        return newPrompts;
      });
      
      refreshPrompts();
      return updatedPrompt!;
    } catch (error) {
      console.error('Error updating prompt:', error);
      throw error;
    }
  }, [setPrompts, refreshPrompts]);

  const deletePrompt = useCallback(async (id: number) => {
    try {
      console.log('Deleting prompt:', id);
      setPrompts((currentPrompts) => {
        console.log('Current prompts:', currentPrompts);
        const newPrompts = currentPrompts.filter((prompt) => prompt.id !== id);
        console.log('Remaining prompts:', newPrompts);
        return newPrompts;
      });
      refreshPrompts();
    } catch (error) {
      console.error('Error deleting prompt:', error);
      throw error;
    }
  }, [setPrompts, refreshPrompts]);

  return {
    prompts,
    isLoading: false,
    isError: false,
    error: null,
    createPrompt,
    updatePrompt,
    deletePrompt,
    refreshPrompts,
  };
}