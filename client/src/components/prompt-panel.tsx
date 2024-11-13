import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { usePrompts } from "../hooks/use-prompts";
import { PromptEditor } from "./prompt-editor";
import { SearchBar } from "./search-bar";
import type { Prompt } from "db/schema";
import { Loader2, Plus, Heart, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function PromptPanel() {
  const { prompts, isLoading } = usePrompts();
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showLikedOnly, setShowLikedOnly] = useState(false);
  const [showNsfwOnly, setShowNsfwOnly] = useState(false);

  const filteredPrompts = prompts?.filter(
    (prompt) =>
      ((!showLikedOnly || prompt.isLiked) &&
       (!showNsfwOnly || prompt.isNsfw)) &&
      (prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
       prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
       prompt.tags?.some((tag) =>
         tag.toLowerCase().includes(searchQuery.toLowerCase())
       ))
  );

  const handleCreateNew = () => {
    setSelectedPrompt(null);
    setIsCreating(true);
  };

  const handleCloseEditor = () => {
    setSelectedPrompt(null);
    setIsCreating(false);
  };

  return (
    <div className="h-full">
      <PanelGroup direction="horizontal">
        <Panel defaultSize={30} minSize={20}>
          <div className="h-full flex flex-col p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
                <Button onClick={handleCreateNew} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="liked"
                    checked={showLikedOnly}
                    onCheckedChange={setShowLikedOnly}
                  />
                  <Label htmlFor="liked" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    お気に入り
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="nsfw"
                    checked={showNsfwOnly}
                    onCheckedChange={setShowNsfwOnly}
                  />
                  <Label htmlFor="nsfw" className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    NSFW
                  </Label>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 mt-4">
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredPrompts?.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">
                  No prompts found
                </div>
              ) : (
                filteredPrompts?.map((prompt) => (
                  <div key={prompt.id} className="mb-2">
                    <Button
                      variant={selectedPrompt?.id === prompt.id ? "default" : "ghost"}
                      className="w-full justify-start flex-col items-start p-4 h-auto"
                      onClick={() => {
                        setSelectedPrompt(prompt);
                        setIsCreating(false);
                      }}
                    >
                      <div className="font-medium flex items-center gap-2">
                        {prompt.title}
                        {prompt.isLiked && <Heart className="h-4 w-4 text-red-500" />}
                        {prompt.isNsfw && <ShieldAlert className="h-4 w-4 text-yellow-500" />}
                      </div>
                      {prompt.tags && prompt.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {prompt.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </Button>
                  </div>
                ))
              )}
            </ScrollArea>
          </div>
        </Panel>
        
        <PanelResizeHandle className="w-1.5 bg-border mx-1 rounded-full" />
        
        <Panel defaultSize={70}>
          <div className="h-full p-4">
            {(selectedPrompt || isCreating) && (
              <PromptEditor
                prompt={selectedPrompt}
                onClose={handleCloseEditor}
              />
            )}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
