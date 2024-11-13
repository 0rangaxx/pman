import { useState } from "react";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { usePrompts } from "../hooks/use-prompts";

interface PromptEditorProps {
  prompt: Prompt | null;
  onClose: () => void;
}

export function PromptEditor({ prompt, onClose }: PromptEditorProps) {
  const { createPrompt, updatePrompt, deletePrompt } = usePrompts();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertPromptSchema),
    defaultValues: prompt || {
      title: "",
      content: "",
      tags: [],
      metadata: {},
    },
  });

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
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!prompt) return;
    try {
      await deletePrompt(prompt.id);
      toast({ title: "Prompt deleted successfully" });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea {...field} className="min-h-[200px]" />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          {prompt && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              Delete
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {prompt ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
