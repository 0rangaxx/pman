import { useState, useMemo, useCallback } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { usePrompts } from "../hooks/use-prompts";
import { PromptEditor } from "./prompt-editor";
import { SearchBar, type SearchCriteria } from "./search-bar";
import type { Prompt } from "db/schema";
import { Loader2, Plus, Heart, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { desanitizeForDisplay, sanitizeInput } from "@/lib/security";

export function PromptPanel() {
  // ... existing state declarations ...
  const { prompts, isLoading, refreshPrompts } = usePrompts();
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    query: "",
    field: "all",
    dateRange: undefined,
    caseSensitive: false,
    selectedTags: [],
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showLikedOnly, setShowLikedOnly] = useState(false);
  const [showNsfwOnly, setShowNsfwOnly] = useState(false);

  // ... existing useCallback and useMemo functions ...
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    prompts?.forEach((prompt) => {
      if (Array.isArray(prompt.tags)) {
        prompt.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [prompts]);

  const filteredPrompts = useMemo(() => {
    return prompts?.filter((prompt) => {
      if (showLikedOnly && !prompt.isLiked) {
        return false;
      }
      if (showNsfwOnly && !prompt.isNsfw) {
        return false;
      }

      console.log('Filtering prompt:', {
        id: prompt.id,
        isLiked: prompt.isLiked,
        isNsfw: prompt.isNsfw,
        showLikedOnly,
        showNsfwOnly,
        passes: !(showLikedOnly && !prompt.isLiked) && !(showNsfwOnly && !prompt.isNsfw)
      });

      if (searchCriteria.selectedTags.length > 0) {
        const promptTags = Array.isArray(prompt.tags) ? prompt.tags : [];
        if (!searchCriteria.selectedTags.every((tag) => promptTags.includes(tag))) {
          return false;
        }
      }

      if (searchCriteria.dateRange?.from && searchCriteria.dateRange?.to) {
        const promptDate = prompt.createdAt ? new Date(prompt.createdAt) : new Date();
        if (!isWithinInterval(promptDate, {
          start: searchCriteria.dateRange.from,
          end: searchCriteria.dateRange.to,
        })) {
          return false;
        }
      }

      if (!searchCriteria.query) return true;

      const query = searchCriteria.caseSensitive
        ? searchCriteria.query
        : searchCriteria.query.toLowerCase();

      const matchText = (text: string) => {
        const desanitizedText = desanitizeForDisplay(text);
        const searchText = searchCriteria.caseSensitive 
          ? desanitizedText 
          : desanitizedText.toLowerCase();
        const sanitizedQuery = sanitizeInput(query);
        return searchText.includes(desanitizeForDisplay(sanitizedQuery));
      };

      switch (searchCriteria.field) {
        case "title":
          return matchText(prompt.title);
        case "content":
          return matchText(prompt.content);
        case "tags":
          return Array.isArray(prompt.tags) && prompt.tags.some(tag => matchText(tag));
        case "metadata":
          return Object.entries(prompt.metadata || {}).some(
            ([key, value]) => matchText(key) || matchText(value.toString())
          );
        case "all":
        default:
          return (
            matchText(prompt.title) ||
            matchText(prompt.content) ||
            (Array.isArray(prompt.tags) && prompt.tags.some(tag => matchText(tag))) ||
            Object.entries(prompt.metadata || {}).some(
              ([key, value]) => matchText(key) || matchText(value.toString())
            )
          );
      }
    });
  }, [prompts, searchCriteria, showLikedOnly, showNsfwOnly]);

  const handleCreateNew = useCallback(() => {
    setSelectedPrompt(null);
    setIsCreating(true);
  }, []);

  const handleCloseEditor = useCallback(() => {
    console.log('Closing editor, refreshing list');
    setSelectedPrompt(null);
    setIsCreating(false);
    refreshPrompts();
  }, [refreshPrompts]);

  const handleTagClick = useCallback((tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchCriteria(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag]
    }));
  }, []);

  const handlePromptSelect = useCallback((prompt: Prompt) => {
    console.log('Selecting prompt:', prompt.id);
    setSelectedPrompt(prompt);
    setIsCreating(false);
  }, []);

  const handleLikedChange = useCallback((checked: boolean) => {
    console.log('Toggling liked only:', checked);
    setShowLikedOnly(checked);
  }, []);

  const handleNsfwChange = useCallback((checked: boolean) => {
    console.log('Toggling nsfw only:', checked);
    setShowNsfwOnly(checked);
  }, []);

  return (
    <div className="h-full">
      <PanelGroup direction="horizontal">
        <Panel defaultSize={30} minSize={20}>
          <div className="h-full flex flex-col p-4 bg-background/95 dark:bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <SearchBar 
                  criteria={searchCriteria} 
                  onCriteriaChange={setSearchCriteria}
                  availableTags={availableTags}
                />
                <Button onClick={handleCreateNew} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="liked"
                    checked={showLikedOnly}
                    onCheckedChange={handleLikedChange}
                  />
                  <Label htmlFor="liked" className="flex items-center gap-2 text-foreground dark:text-foreground/90">
                    <Heart className="h-4 w-4" />
                    お気に入り
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="nsfw"
                    checked={showNsfwOnly}
                    onCheckedChange={handleNsfwChange}
                  />
                  <Label htmlFor="nsfw" className="flex items-center gap-2 text-foreground dark:text-foreground/90">
                    <ShieldAlert className="h-4 w-4" />
                    NSFW
                  </Label>
                </div>
              </div>
            </div>

            <ScrollArea 
              className="flex-1 mt-4" 
              key={`${prompts?.length}-${showLikedOnly}-${showNsfwOnly}-${searchCriteria.query}`}
            >
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
                      className={cn(
                        "w-full justify-start flex-col items-start p-4 h-auto",
                        "dark:hover:bg-background/80 dark:data-[state=selected]:bg-background/80"
                      )}
                      onClick={() => handlePromptSelect(prompt)}
                    >
                      <div className="font-medium flex items-center gap-2 text-foreground dark:text-foreground/90">
                        {desanitizeForDisplay(prompt.title)}
                        {prompt.isLiked && <Heart className="h-4 w-4 text-red-500" />}
                        {prompt.isNsfw && <ShieldAlert className="h-4 w-4 text-yellow-500" />}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {desanitizeForDisplay(prompt.content)}
                      </div>
                      {Array.isArray(prompt.tags) && prompt.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {prompt.tags.map((tag) => (
                            <Badge 
                              key={tag} 
                              variant={searchCriteria.selectedTags.includes(tag) ? "default" : "secondary"}
                              className={cn(
                                "text-xs cursor-pointer",
                                searchCriteria.selectedTags.includes(tag)
                                  ? "hover:bg-primary/80"
                                  : "hover:bg-secondary/80"
                              )}
                              onClick={(e) => handleTagClick(tag, e)}
                            >
                              {desanitizeForDisplay(tag)}
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
                key={selectedPrompt?.id || 'new'}
                prompt={selectedPrompt}
                onClose={handleCloseEditor}
                setSelectedPrompt={setSelectedPrompt}
              />
            )}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
