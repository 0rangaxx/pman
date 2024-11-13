import { useState, useEffect } from "react";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { usePrompts } from "../hooks/use-prompts";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2, Wand2, Copy, Heart, ShieldAlert } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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

  const form = useForm({
    resolver: zodResolver(insertPromptSchema),
    defaultValues: defaultValues,
  });

  useEffect(() => {
    if (prompt) {
      console.log('Resetting form with prompt:', prompt);
      form.reset({
        title: prompt.title,
        content: prompt.content,
        tags: prompt.tags || [],
        metadata: prompt.metadata || {},
        isLiked: prompt.isLiked || false,
        isNsfw: prompt.isNsfw || false,
      });
    } else {
      form.reset(defaultValues);
    }
  }, [prompt, form]);

  const tags = form.watch("tags") || [];
  const metadata = form.watch("metadata") || {};

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      const currentTags = form.getValues("tags") || [];
      if (!currentTags.includes(newTag.trim())) {
        form.setValue("tags", [...currentTags, newTag.trim()]);
      }
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove)
    );
  };

  const handleAddMetadata = () => {
    if (newMetadataKey.trim() && newMetadataValue.trim()) {
      const currentMetadata = form.getValues("metadata") || {};
      form.setValue("metadata", {
        ...currentMetadata,
        [newMetadataKey.trim()]: newMetadataValue.trim(),
      });
      setNewMetadataKey("");
      setNewMetadataValue("");
    }
  };

  const handleRemoveMetadata = (key: string) => {
    const currentMetadata = form.getValues("metadata") || {};
    const { [key]: _, ...rest } = currentMetadata;
    form.setValue("metadata", rest);
  };

  const handleFormatContent = () => {
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
  };

  const handleCopyContent = async () => {
    const content = form.getValues("content");
    await navigator.clipboard.writeText(content);
    toast({
      title: "コピーしました",
      description: "内容をクリップボードにコピーしました。",
    });
  };

  const onSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      if (prompt) {
        console.log('Updating prompt:', { id: prompt.id, values });
        const updateData = {
          ...values,
          tags: values.tags || [],
          metadata: values.metadata || {},
        };
        const updatedPrompt = await updatePrompt(prompt.id, updateData);
        console.log('Update successful:', updatedPrompt);
        toast({ title: "Prompt updated successfully" });
        setSelectedPrompt(updatedPrompt || null);
      } else {
        const newPrompt = await createPrompt(values);
        console.log('Created prompt:', newPrompt);
        toast({ title: "Prompt created successfully" });
      }
      onClose();
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
    console.log('Form values before submission:', values);
    return onSubmit(values);
  });

  const handleDelete = async () => {
    if (!prompt) return;
    try {
      setIsSubmitting(true);
      await deletePrompt(prompt.id);
      toast({ title: "Prompt deleted successfully" });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{prompt ? "Edit Prompt" : "Create New Prompt"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
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
                      <Textarea {...field} className="min-h-[200px]" />
                    </FormControl>
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
                  </div>
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
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                      id="isNsfw"
                    />
                    <Label htmlFor="isNsfw" className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4" />
                      NSFW
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-2"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="Add tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleAddTag}
              />
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
                    <span>{value as string}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      onClick={() => handleRemoveMetadata(key)}
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
                  />
                  <Input
                    placeholder="Value"
                    value={newMetadataValue}
                    onChange={(e) => setNewMetadataValue(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddMetadata}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </FormItem>
          </CardContent>

          <CardFooter className="flex justify-end gap-2">
            {prompt && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Delete"
                )}
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
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
