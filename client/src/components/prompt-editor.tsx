import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPromptSchema, type Prompt } from "db/schema";
import { Button } from "../components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { useToast } from "../hooks/use-toast";
import { usePrompts } from "../hooks/use-prompts";
import { Badge } from "../components/ui/badge";
import { X, Plus, Loader2, Wand2, Copy, Heart, ShieldAlert, AlertCircle, Lock } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Alert } from "../components/ui/alert";
import { sanitizeObject, desanitizeForDisplay } from "../lib/security";
import { useAuth } from "../hooks/use-auth";

interface PromptEditorProps {
  prompt: Prompt | null;
  onClose: () => void;
  setSelectedPrompt: (prompt: Prompt | null) => void;
  isEditable?: boolean;
}

interface FormValues {
  title: string;
  content: string;
  tags: string[];
  metadata: Record<string, string>;
  isLiked: boolean;
  isNsfw: boolean;
  isPrivate: boolean;
}

const defaultValues: FormValues = {
  title: "",
  content: "",
  tags: [],
  metadata: {},
  isLiked: false,
  isNsfw: false,
  isPrivate: false,
};

export function PromptEditor({ prompt, onClose, setSelectedPrompt, isEditable = true }: PromptEditorProps) {
  const { createPrompt, updatePrompt, deletePrompt, refreshPrompts } = usePrompts();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newMetadataKey, setNewMetadataKey] = useState("");
  const [newMetadataValue, setNewMetadataValue] = useState("");
  const [isFormatting, setIsFormatting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Convert SQLite integer boolean to JavaScript boolean
  const convertToBoolean = (value: number | null | undefined): boolean => {
    return value === 1;
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(insertPromptSchema),
    defaultValues: prompt ? {
      title: prompt.title,
      content: prompt.content,
      tags: Array.isArray(prompt.tags) ? prompt.tags as string[] : [],
      metadata: (prompt.metadata as Record<string, string>) || {},
      isLiked: convertToBoolean(prompt.isLiked),
      isNsfw: convertToBoolean(prompt.isNsfw),
      isPrivate: convertToBoolean(prompt.isPrivate),
    } : defaultValues,
    disabled: !isEditable
  });

  useEffect(() => {
    if (prompt) {
      form.reset({
        title: desanitizeForDisplay(prompt.title),
        content: desanitizeForDisplay(prompt.content),
        tags: Array.isArray(prompt.tags) ? (prompt.tags as string[]).map(desanitizeForDisplay) : [],
        metadata: Object.entries(prompt.metadata || {}).reduce<Record<string, string>>((acc, [key, value]) => ({
          ...acc,
          [desanitizeForDisplay(key)]: typeof value === 'string' ? desanitizeForDisplay(value) : String(value)
        }), {}),
        isLiked: convertToBoolean(prompt.isLiked),
        isNsfw: convertToBoolean(prompt.isNsfw),
        isPrivate: convertToBoolean(prompt.isPrivate),
      });
    } else {
      form.reset(defaultValues);
    }
  }, [prompt, form]);

  // Rest of the component remains the same...
  const tags = form.watch("tags") || [];
  const metadata = form.watch("metadata") || {};

  const handleAddTag = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isEditable) return;
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      const sanitizedTag = sanitizeObject({ tag: newTag.trim() }).tag;
      const currentTags = form.getValues("tags") || [];
      if (!currentTags.includes(sanitizedTag)) {
        form.setValue("tags", [...currentTags, sanitizedTag]);
      }
      setNewTag("");
    }
  }, [newTag, form, isEditable]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    if (!isEditable) return;
    const currentTags = form.getValues("tags") || [];
    form.setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove)
    );
  }, [form, isEditable]);

  const handleAddMetadata = useCallback(() => {
    if (!isEditable) return;
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
  }, [newMetadataKey, newMetadataValue, form, isEditable]);

  const handleRemoveMetadata = useCallback((key: string) => {
    if (!isEditable) return;
    const currentMetadata = form.getValues("metadata") || {};
    const { [key]: _, ...rest } = currentMetadata;
    form.setValue("metadata", rest);
  }, [form, isEditable]);

  const handleFormatContent = useCallback(() => {
    if (!isEditable) return;
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
  }, [form, toast, isEditable]);

  const handleCopyContent = useCallback(async () => {
    const content = form.getValues("content");
    await navigator.clipboard.writeText(content);
    toast({
      title: "コピーしました",
      description: "内容をクリップボードにコピーしました。",
    });
  }, [form, toast]);

  const onSubmit = async (values: FormValues) => {
    if (!isEditable) return;
    try {
      setIsSubmitting(true);
      console.log('Submitting sanitized form values:', values);

      const sanitizedValues = {
        ...sanitizeObject(values),
        // Convert boolean to integer for SQLite
        isLiked: values.isLiked ? 1 : 0,
        isNsfw: values.isNsfw ? 1 : 0,
        isPrivate: values.isPrivate ? 1 : 0,
      };

      if (prompt) {
        const updateData = {
          ...sanitizedValues,
          tags: sanitizedValues.tags || [],
          metadata: sanitizedValues.metadata || {},
        };
        console.log('Updating prompt:', updateData);
        const updatedPrompt = await updatePrompt(prompt.id, updateData);
        console.log('Update successful:', updatedPrompt);

        // Refresh all prompts after successful update
        await refreshPrompts();

        toast({
          title: "Prompt updated successfully",
          variant: "default"
        });
        setSelectedPrompt(updatedPrompt);
      } else {
        console.log('Creating new prompt');
        const newPrompt = await createPrompt(sanitizedValues);
        console.log('Creation successful:', newPrompt);

        // Refresh all prompts after successful creation
        await refreshPrompts();

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
    if (!isEditable) return;
    if (!prompt || !showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    try {
      setIsSubmitting(true);
      await deletePrompt(prompt.id);

      // Refresh all prompts after successful deletion
      await refreshPrompts();

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

  // Rest of the component remains the same...
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{prompt ? "Edit Prompt" : "Create New Prompt"}</CardTitle>
        <CardDescription>
          {prompt ? "Update the existing prompt" : "Create a new prompt with the form below"}
          {!isEditable && " (Read-only mode)"}
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
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={100} disabled={!isEditable} />
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
                  <FormLabel>Content</FormLabel>
                  <div className="flex gap-2">
                    <FormControl className="flex-1">
                      <Textarea {...field} className="min-h-[200px]" maxLength={2000} disabled={!isEditable} />
                    </FormControl>
                    {isEditable && (
                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleFormatContent}
                          disabled={isFormatting}
                          className="self-start"
                        >
                          <Wand2 className={`h-4 w-4 ${isFormatting ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleCopyContent}
                          className="self-start"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
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
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="isLiked"
                      disabled={!isEditable}
                    />
                    <Label htmlFor="isLiked" className="flex items-center gap-2">
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
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="isNsfw"
                      disabled={!isEditable}
                    />
                    <Label htmlFor="isNsfw" className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4" />
                      NSFW
                    </Label>
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="isPrivate"
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="isPrivate"
                      disabled={!isEditable}
                    />
                    <Label htmlFor="isPrivate" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Private
                    </Label>
                  </div>
                )}
              />
            </div>

            <FormItem>
              <FormLabel>Tags</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    {isEditable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-2"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </Badge>
                ))}
              </div>
              {isEditable && (
                <Input
                  placeholder="Add tag and press Enter..."
                  value={newTag}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTag(e.target.value)}
                  onKeyDown={handleAddTag}
                  maxLength={50}
                />
              )}
              <FormDescription>
                Press Enter to add a new tag. Tags help organize your prompts.
              </FormDescription>
            </FormItem>

            <FormItem>
              <FormLabel>Metadata</FormLabel>
              <div className="space-y-2">
                {Object.entries(metadata).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 p-2 rounded-md border"
                  >
                    <span className="font-medium">{key}:</span>
                    <span>{value}</span>
                    {isEditable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto"
                        onClick={() => handleRemoveMetadata(key)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {isEditable && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Key"
                      value={newMetadataKey}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMetadataKey(e.target.value)}
                      maxLength={50}
                    />
                    <Input
                      placeholder="Value"
                      value={newMetadataValue}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMetadataValue(e.target.value)}
                      maxLength={100}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleAddMetadata}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <FormDescription>
                  Add custom metadata as key-value pairs to provide additional information.
                </FormDescription>
              </div>
            </FormItem>

            {showDeleteConfirm && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <p>Are you sure you want to delete this prompt? This action cannot be undone.</p>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-2">
            {prompt && isEditable && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting}
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
            {isEditable && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : prompt ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
