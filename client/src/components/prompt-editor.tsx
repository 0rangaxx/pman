import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPromptSchema, type Prompt } from "db/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { usePrompts } from "../hooks/use-prompts";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2, Wand2, Copy, Heart, ShieldAlert, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { sanitizeObject, desanitizeForDisplay } from "@/lib/security";

interface PromptEditorProps {
  prompt: Prompt | null;
  onClose: () => void;
  setSelectedPrompt: (prompt: Prompt | null) => void;
}

const defaultValues = {
  title: "",
  content: "",
  tags: [] as string[],
  metadata: {} as Record<string, string>,
  isLiked: false,
  isNsfw: false,
};

export function PromptEditor({ prompt, onClose, setSelectedPrompt }: PromptEditorProps) {
  const { createPrompt, updatePrompt, deletePrompt } = usePrompts();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newMetadataKey, setNewMetadataKey] = useState("");
  const [newMetadataValue, setNewMetadataValue] = useState("");
  const [isFormatting, setIsFormatting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertPromptSchema),
    defaultValues: prompt || defaultValues,
  });

  useEffect(() => {
    if (prompt) {
      // Desanitize values when displaying in the form
      form.reset({
        title: desanitizeForDisplay(prompt.title),
        content: desanitizeForDisplay(prompt.content),
        tags: Array.isArray(prompt.tags) ? prompt.tags.map(desanitizeForDisplay) : [],
        metadata: Object.entries(prompt.metadata || {}).reduce((acc, [key, value]) => ({
          ...acc,
          [desanitizeForDisplay(key)]: typeof value === 'string' ? desanitizeForDisplay(value) : value
        }), {}),
        isLiked: prompt.isLiked || false,
        isNsfw: prompt.isNsfw || false,
      });
    } else {
      form.reset(defaultValues);
    }
  }, [prompt, form]);

  const tags = form.watch("tags") || [];
  const metadata = form.watch("metadata") || {};

  const handleAddTag = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      const sanitizedTag = sanitizeObject({ tag: newTag.trim() }).tag;
      const currentTags = form.getValues("tags") || [];
      if (!currentTags.includes(sanitizedTag)) {
        form.setValue("tags", [...currentTags, sanitizedTag]);
      }
      setNewTag("");
    }
  }, [newTag, form]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove)
    );
  }, [form]);

  const handleAddMetadata = useCallback(() => {
    if (newMetadataKey.trim() && newMetadataValue.trim()) {
      const sanitized = sanitizeObject({
        key: newMetadataKey.trim(),
        value: newMetadataValue.trim()
      });
      const currentMetadata = form.getValues("metadata") || {};
      form.setValue("metadata", {
        ...currentMetadata,
        [sanitized.key]: sanitized.value,
      });
      setNewMetadataKey("");
      setNewMetadataValue("");
    }
  }, [newMetadataKey, newMetadataValue, form]);

  const handleRemoveMetadata = useCallback((key: string) => {
    const currentMetadata = form.getValues("metadata") || {};
    const { [key]: _, ...rest } = currentMetadata;
    form.setValue("metadata", rest);
  }, [form]);

  const handleFormatContent = useCallback(() => {
    setIsFormatting(true);
    const content = form.getValues("content");
    const formatted = content
      .replace(/,(?!\s)/g, ", ")
      .replace(/_/g, " ");
    
    form.setValue("content", formatted);
    
    toast({
      title: "Content formatted",
      description: "Applied formatting rules to the content.",
    });
    
    setIsFormatting(false);
  }, [form, toast]);

  const handleCopyContent = useCallback(async () => {
    const content = form.getValues("content");
    await navigator.clipboard.writeText(content);
    toast({
      title: "コピーしました",
      description: "内容をクリップボードにコピーしました。",
    });
  }, [form, toast]);

  const onSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      console.log('Submitting sanitized form values:', values);
      
      // Sanitize all input values
      const sanitizedValues = sanitizeObject(values);
      
      if (prompt) {
        const updateData = {
          ...sanitizedValues,
          tags: sanitizedValues.tags || [],
          metadata: sanitizedValues.metadata || {},
        };
        console.log('Updating prompt:', updateData);
        const updatedPrompt = await updatePrompt(prompt.id, updateData);
        console.log('Update successful:', updatedPrompt);
        toast({ 
          title: "Prompt updated successfully",
          variant: "default"
        });
        setSelectedPrompt(updatedPrompt);
      } else {
        console.log('Creating new prompt');
        const newPrompt = await createPrompt(sanitizedValues);
        console.log('Creation successful:', newPrompt);
        toast({ 
          title: "Prompt created successfully",
          variant: "default"
        });
        onClose();
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = form.handleSubmit((values) => {
    return onSubmit(values);
  });

  const handleDelete = async () => {
    if (!prompt || !showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    
    try {
      setIsSubmitting(true);
      await deletePrompt(prompt.id);
      toast({ 
        title: "Prompt deleted successfully",
        variant: "default"
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <Card className="w-full bg-background/95 dark:bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <CardHeader>
        <CardTitle className="text-foreground dark:text-foreground/90">
          {prompt ? "Edit Prompt" : "Create New Prompt"}
        </CardTitle>
        <CardDescription>
          {prompt ? "Update the existing prompt" : "Create a new prompt with the form below"}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground dark:text-foreground/90">Title</FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={100} className="dark:bg-background/80 dark:border-border" />
                  </FormControl>
                  <FormDescription>
                    Enter a descriptive title for your prompt
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground dark:text-foreground/90">Content</FormLabel>
                  <div className="flex gap-2">
                    <FormControl className="flex-1">
                      <Textarea {...field} className="min-h-[200px] dark:bg-background/80 dark:border-border" maxLength={2000} />
                    </FormControl>
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleFormatContent}
                        disabled={isFormatting}
                        className="self-start dark:bg-background/80 dark:border-border"
                      >
                        <Wand2 className={`h-4 w-4 ${isFormatting ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleCopyContent}
                        className="self-start dark:bg-background/80 dark:border-border"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <FormDescription>
                    Write your prompt content here. Use the format button to clean up the text.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center space-x-8">
              <FormField
                control={form.control}
                name="isLiked"
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                      id="isLiked"
                      className="dark:bg-background/80 dark:border-border"
                    />
                    <Label htmlFor="isLiked" className="flex items-center gap-2 dark:text-foreground/90">
                      <Heart className="h-4 w-4" />
                      お気に入り
                    </Label>
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="isNsfw"
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                      id="isNsfw"
                      className="dark:bg-background/80 dark:border-border"
                    />
                    <Label htmlFor="isNsfw" className="flex items-center gap-2 dark:text-foreground/90">
                      <ShieldAlert className="h-4 w-4" />
                      NSFW
                    </Label>
                  </div>
                )}
              />
            </div>

            <FormItem>
              <FormLabel className="text-foreground dark:text-foreground/90">Tags</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="dark:bg-background/80 dark:border-border">
                    {tag}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-2"
                      onClick={() => handleRemoveTag(tag)}
                      className="dark:bg-background/80 dark:border-border"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="Add tag and press Enter..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleAddTag}
                maxLength={50}
                className="dark:bg-background/80 dark:border-border"
              />
              <FormDescription>
                Press Enter to add a new tag. Tags help organize your prompts.
              </FormDescription>
            </FormItem>

            <FormItem>
              <FormLabel className="text-foreground dark:text-foreground/90">Metadata</FormLabel>
              <div className="space-y-2">
                {Object.entries(metadata).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 p-2 rounded-md border dark:bg-background/80 dark:border-border"
                  >
                    <span className="font-medium dark:text-foreground/90">{key}:</span>
                    <span className="dark:text-foreground/90">{value as string}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      onClick={() => handleRemoveMetadata(key)}
                      className="dark:bg-background/80 dark:border-border"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Key"
                    value={newMetadataKey}
                    onChange={(e) => setNewMetadataKey(e.target.value)}
                    maxLength={50}
                    className="dark:bg-background/80 dark:border-border"
                  />
                  <Input
                    placeholder="Value"
                    value={newMetadataValue}
                    onChange={(e) => setNewMetadataValue(e.target.value)}
                    maxLength={100}
                    className="dark:bg-background/80 dark:border-border"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddMetadata}
                    className="dark:bg-background/80 dark:border-border"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <FormDescription>
                  Add custom metadata as key-value pairs to provide additional information.
                </FormDescription>
              </div>
            </FormItem>

            {showDeleteConfirm && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <p className="dark:text-foreground/90">Are you sure you want to delete this prompt? This action cannot be undone.</p>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-2">
            {prompt && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="dark:bg-background/80 dark:border-border"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : showDeleteConfirm ? (
                  "Confirm Delete"
                ) : (
                  "Delete"
                )}
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting} className="dark:bg-background/80 dark:border-border">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : prompt ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}