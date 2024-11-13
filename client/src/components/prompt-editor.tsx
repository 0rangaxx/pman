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
import { X, Plus, Loader2, Wand2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PromptEditorProps {
  prompt: Prompt | null;
  onClose: () => void;
}

const defaultValues = {
  title: "",
  content: "",
  tags: [],
  metadata: {},
};

export function PromptEditor({ prompt, onClose }: PromptEditorProps) {
  const { createPrompt, updatePrompt, deletePrompt } = usePrompts();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newMetadataKey, setNewMetadataKey] = useState("");
  const [newMetadataValue, setNewMetadataValue] = useState("");
  const [isFormatting, setIsFormatting] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertPromptSchema),
    defaultValues: prompt || defaultValues,
  });

  useEffect(() => {
    form.reset(prompt || defaultValues);
  }, [prompt, form]);

  const tags = form.watch("tags") || [];
  const metadata = form.watch("metadata") || {};

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      if (!tags.includes(newTag.trim())) {
        form.setValue("tags", [...tags, newTag.trim()]);
      }
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    form.setValue(
      "tags",
      tags.filter((tag) => tag !== tagToRemove)
    );
  };

  const handleAddMetadata = () => {
    if (newMetadataKey.trim() && newMetadataValue.trim()) {
      form.setValue("metadata", {
        ...metadata,
        [newMetadataKey.trim()]: newMetadataValue.trim(),
      });
      setNewMetadataKey("");
      setNewMetadataValue("");
    }
  };

  const handleRemoveMetadata = (key: string) => {
    const { [key]: _, ...rest } = metadata;
    form.setValue("metadata", rest);
  };

  const handleFormatContent = () => {
    setIsFormatting(true);
    const content = form.getValues("content");
    const formatted = content
      .replace(/,(?!\s)/g, ", ") // Add space after commas if missing
      .replace(/_/g, " "); // Replace underscores with spaces
    
    form.setValue("content", formatted);
    
    toast({
      title: "Content formatted",
      description: "Applied formatting rules to the content.",
    });
    
    setIsFormatting(false);
  };

  const onSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      if (prompt) {
        await updatePrompt(prompt.id, values);
        toast({ title: "Prompt updated successfully" });
      } else {
        await createPrompt(values);
        toast({ title: "Prompt created successfully" });
      }
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
        <form onSubmit={form.handleSubmit(onSubmit)}>
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
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Tags</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
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
