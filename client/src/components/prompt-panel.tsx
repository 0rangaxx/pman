import { useState, useMemo, useCallback } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ScrollArea } from "../components/ui/scroll-area";
import { Button } from "../components/ui/button";
import { usePrompts } from "../hooks/use-prompts";
import { PromptEditor } from "./prompt-editor";
import { SearchBar, type SearchCriteria } from "./search-bar";
import type { Prompt } from "db/schema";
import { Loader2, Plus, Heart, ShieldAlert, Lock } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { isWithinInterval } from "date-fns";
import { cn } from "../lib/utils";
import { desanitizeForDisplay, sanitizeInput } from "../lib/security";
import { useAuth } from "../hooks/use-auth";

export function PromptPanel() {
  const { prompts, isLoading, isRefreshing, refreshPrompts } = usePrompts();
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
  const [showPrivateOnly, setShowPrivateOnly] = useState(false);
  const { user } = useAuth();

  // Memoized available tags with refresh trigger
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    prompts?.forEach((prompt) => {
      const tags = Array.isArray(prompt.tags) ? prompt.tags : [];
      tags.forEach((tag) => {
        if (typeof tag === 'string') {
          tagSet.add(tag);
        }
      });
    });
    return Array.from(tagSet).sort();
  }, [prompts]);

  // Memoized filtered prompts with refresh dependency
  const filteredPrompts = useMemo(() => {
    if (!prompts) return [];

    return prompts.filter((prompt) => {
      if (showLikedOnly && !prompt.isLiked) return false;
      if (showNsfwOnly && !prompt.isNsfw) return false;
      if (showPrivateOnly && !prompt.isPrivate) return false;

      if (searchCriteria.selectedTags.length > 0) {
        const promptTags = Array.isArray(prompt.tags) ? prompt.tags : [];
        if (!searchCriteria.selectedTags.every((tag) =>
          promptTags.some((t) => typeof t === 'string' && t === tag)
        )) {
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

      const matchText = (text: string | null | undefined) => {
        if (!text) return false;
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
          const tags = Array.isArray(prompt.tags) ? prompt.tags : [];
          return tags.some((tag) => typeof tag === 'string' && matchText(tag));
        case "metadata":
          const metadata = prompt.metadata || {};
          return Object.entries(metadata).some(
            ([key, value]) => matchText(key) || matchText(String(value))
          );
        case "all":
        default:
          return (
            matchText(prompt.title) ||
            matchText(prompt.content) ||
            (Array.isArray(prompt.tags) && prompt.tags.some((tag) => typeof tag === 'string' && matchText(tag))) ||
            Object.entries(prompt.metadata || {}).some(
              ([key, value]) => matchText(key) || matchText(String(value))
            )
          );
      }
    });
  }, [prompts, searchCriteria, showLikedOnly, showNsfwOnly, showPrivateOnly]);

  const handleCreateNew = useCallback(() => {
    setSelectedPrompt(null);
    setIsCreating(true);
  }, []);

  const handleCloseEditor = useCallback(async () => {
    setSelectedPrompt(null);
    setIsCreating(false);
    // Ensure fresh data after editor is closed
    await refreshPrompts();
  }, [refreshPrompts]);

  const handleTagClick = useCallback((tag: string) => {
    setSearchCriteria((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter((t) => t !== tag)
        : [...prev.selectedTags, tag],
    }));
  }, []);

  const handlePromptSelect = useCallback(async (prompt: Prompt) => {
    // Refresh data before showing the prompt to ensure we have the latest version
    await refreshPrompts();
    setSelectedPrompt(prompt);
    setIsCreating(false);
  }, [refreshPrompts]);

  const handleLikedChange = useCallback((checked: boolean) => {
    setShowLikedOnly(checked);
  }, []);

  const handleNsfwChange = useCallback((checked: boolean) => {
    setShowNsfwOnly(checked);
  }, []);

  const handlePrivateChange = useCallback((checked: boolean) => {
    setShowPrivateOnly(checked);
  }, []);

  // Generate a unique key for the ScrollArea that changes when relevant states change
  const scrollAreaKey = useMemo(() => {
    return `prompts-${prompts?.length}-${showLikedOnly}-${showNsfwOnly}-${showPrivateOnly}-${searchCriteria.query}-${isRefreshing}-${Date.now()}`;
  }, [prompts?.length, showLikedOnly, showNsfwOnly, showPrivateOnly, searchCriteria.query, isRefreshing]);

  return (
    <div className="h-full">
      <PanelGroup direction="horizontal">
        <Panel defaultSize={30} minSize={20}>
          <div className="h-full flex flex-col p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <SearchBar
                  criteria={searchCriteria}
                  onCriteriaChange={setSearchCriteria}
                  availableTags={availableTags}
                />
                <Button 
                  onClick={handleCreateNew} 
                  size="icon"
                  disabled={isRefreshing}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="liked"
                    checked={showLikedOnly}
                    onCheckedChange={handleLikedChange}
                    disabled={isRefreshing}
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
                    onCheckedChange={handleNsfwChange}
                    disabled={isRefreshing}
                  />
                  <Label htmlFor="nsfw" className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    NSFW
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="private"
                    checked={showPrivateOnly}
                    onCheckedChange={handlePrivateChange}
                    disabled={isRefreshing}
                  />
                  <Label htmlFor="private" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Private
                  </Label>
                </div>
              </div>
            </div>

            <ScrollArea
              className="flex-1 mt-4 relative"
              key={scrollAreaKey}
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
                <>
                  {isRefreshing && (
                    <div className="absolute top-0 left-0 right-0 flex justify-center p-2 bg-background/80 backdrop-blur z-10">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                  <div className={cn("space-y-2", isRefreshing && "opacity-50 pointer-events-none")}>
                    {filteredPrompts?.map((prompt) => {
                      const tags = Array.isArray(prompt.tags) ? prompt.tags : [];
                      const isEditable = user && prompt.userId === user.id;
                      return (
                        <div key={`${prompt.id}-${prompt.updatedAt}`}>
                          <Button
                            variant={selectedPrompt?.id === prompt.id ? "default" : "ghost"}
                            className="w-full justify-start flex-col items-start p-4 h-auto"
                            onClick={() => handlePromptSelect(prompt)}
                            disabled={isRefreshing}
                          >
                            <div className="font-medium flex items-center gap-2">
                              {desanitizeForDisplay(prompt.title)}
                              {prompt.isLiked && <Heart className="h-4 w-4 text-red-500" />}
                              {prompt.isNsfw && <ShieldAlert className="h-4 w-4 text-yellow-500" />}
                              {prompt.isPrivate && <Lock className="h-4 w-4 text-blue-500" />}
                              {!isEditable && <Lock className="h-4 w-4 text-gray-500" />}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {desanitizeForDisplay(prompt.content)}
                            </div>
                            {tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {tags.filter((tag) => typeof tag === 'string').map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant={searchCriteria.selectedTags.includes(tag) ? "default" : "secondary"}
                                    className={cn(
                                      "text-xs cursor-pointer",
                                      searchCriteria.selectedTags.includes(tag)
                                        ? "hover:bg-primary/80"
                                        : "hover:bg-secondary/80"
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTagClick(tag);
                                    }}
                                  >
                                    {desanitizeForDisplay(tag)}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </>
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
                isEditable={selectedPrompt ? (user && selectedPrompt.userId === user.id) : true}
              />
            )}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
