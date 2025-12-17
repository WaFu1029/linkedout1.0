import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { X, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function CreatePostDialog({ open, onOpenChange, userId }: CreatePostDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Please write something!");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .insert({
          author_id: userId,
          title: title.trim() || null,
          content: content.trim(),
          tags: tags.length > 0 ? tags : [],
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating post:", error);
        toast.error("Failed to share your failure. Try again!");
        return;
      }

      // Invalidate and refetch posts
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      
      toast.success("Your failure has been shared!");
      setTitle("");
      setContent("");
      setTags([]);
      setNewTag("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong. Try again!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[3px] border-foreground shadow-brutal max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Share Your Failure</DialogTitle>
          <DialogDescription>
            Share your failure, setback, or moment of vulnerability with the community.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Title */}
          <div>
            <label className="font-bold text-sm uppercase tracking-wide block mb-2">
              Title (optional)
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your failure a title..."
              className="bg-cream-warm border-[3px] border-foreground text-base font-medium"
              disabled={isSubmitting}
            />
          </div>

          {/* Content */}
          <div>
            <label className="font-bold text-sm uppercase tracking-wide block mb-2">
              What happened?
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your failure, setback, or moment of vulnerability..."
              className="min-h-[150px] bg-cream-warm border-[3px] border-foreground text-base font-medium resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="font-bold text-sm uppercase tracking-wide block mb-2">
              Tags (optional)
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="bg-primary text-primary-foreground px-4 py-2 font-semibold border-[3px] border-foreground flex items-center gap-2"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(i)}
                    className="hover:text-destructive transition-colors"
                    type="button"
                    disabled={isSubmitting}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-xs">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Add tag..."
                className="shadow-none"
                disabled={isSubmitting}
              />
              <Button
                onClick={addTag}
                className="border-[3px] border-foreground shadow-none"
                type="button"
                disabled={isSubmitting}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t-[3px] border-dashed border-foreground">
            <Button
              variant="outline"
              onClick={() => {
                setTitle("");
                setContent("");
                setTags([]);
                setNewTag("");
                onOpenChange(false);
              }}
              className="border-[3px] border-foreground"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !content.trim()}
              className="border-[3px] border-foreground"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                "Share Failure"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

