import { useState } from "react";
import { ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { usePrompts } from "../hooks/use-prompts";
import { PromptEditor } from "./prompt-editor";
import { SearchBar } from "./search-bar";
import type { Prompt } from "db/schema";

export function PromptPanel() {
  const { prompts, isLoading } = usePrompts();
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPrompts = prompts?.filter(
    (prompt) =>
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex">
      <ResizablePanel defaultSize={30} minSize={20}>
        <div className="h-full flex flex-col p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <ScrollArea className="flex-1 mt-4">
            {isLoading ? (
              <div>Loading...</div>
            ) : (
              filteredPrompts?.map((prompt) => (
                <Button
                  key={prompt.id}
                  variant={selectedPrompt?.id === prompt.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedPrompt(prompt)}
                >
                  {prompt.title}
                </Button>
              ))
            )}
          </ScrollArea>
        </div>
      </ResizablePanel>
      
      <ResizableHandle />
      
      <ResizablePanel defaultSize={70}>
        <div className="h-full p-4">
          <PromptEditor
            prompt={selectedPrompt}
            onClose={() => setSelectedPrompt(null)}
          />
        </div>
      </ResizablePanel>
    </div>
  );
}
