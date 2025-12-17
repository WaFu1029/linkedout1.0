import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { X, Plus, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

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
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all unique tags from existing posts
  const { data: existingTags = [] } = useQuery({
    queryKey: ["all-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("tags");
      
      if (error) {
        console.error("Error fetching tags:", error);
        return [];
      }

      const tagSet = new Set<string>();
      data?.forEach((post) => {
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach((tag: string) => {
            if (tag && tag.trim()) {
              tagSet.add(tag.trim().toLowerCase());
            }
          });
        }
      });

      return Array.from(tagSet).sort();
    },
    enabled: open, // Only fetch when dialog is open
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Filter tags based on input
  const filteredTags = useMemo(() => {
    if (!newTag.trim()) {
      return existingTags;
    }
    const searchTerm = newTag.trim().toLowerCase();
    const selectedTagLowercases = tags.map(t => t.toLowerCase());
    return existingTags.filter((tag) => 
      tag.toLowerCase().includes(searchTerm) && !selectedTagLowercases.includes(tag.toLowerCase())
    );
  }, [newTag, existingTags, tags]);

  // Check if current input matches an existing tag exactly
  const exactMatch = useMemo(() => {
    const trimmed = newTag.trim().toLowerCase();
    return existingTags.some(tag => tag.toLowerCase() === trimmed);
  }, [newTag, existingTags]);

  const addTag = (tagToAdd?: string) => {
    const tag = (tagToAdd || newTag.trim()).toLowerCase();
    if (tag && !tags.some(t => t.toLowerCase() === tag)) {
      setTags([...tags, tag]);
      setNewTag("");
      setTagPopoverOpen(false);
    }
  };

  const handleTagInputChange = (value: string) => {
    setNewTag(value);
    setTagPopoverOpen(value.length > 0);
  };

  const handleTagSelect = (tag: string) => {
    addTag(tag);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (newTag.trim()) {
        addTag();
      } else if (filteredTags.length > 0) {
        // Select first suggestion
        handleTagSelect(filteredTags[0]);
      }
    } else if (e.key === "Escape") {
      setTagPopoverOpen(false);
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
        console.error("Error details:", JSON.stringify(error, null, 2));
        toast.error(`Failed to share your failure: ${error.message || 'Unknown error'}`);
        return;
      }

      // Invalidate and refetch posts
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      
      toast.success("Your failure has been shared!");
      setTitle("");
      setContent("");
      setTags([]);
      setNewTag("");
      setTagPopoverOpen(false);
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
            <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
              <PopoverTrigger asChild>
                <div className="flex gap-2 max-w-xs">
                  <Input
                    value={newTag}
                    onChange={(e) => handleTagInputChange(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    onFocus={() => newTag.trim() && setTagPopoverOpen(true)}
                    placeholder="Search or add tag..."
                    className="shadow-none"
                    disabled={isSubmitting}
                  />
                  <Button
                    onClick={() => addTag()}
                    className="border-[3px] border-foreground shadow-none"
                    type="button"
                    disabled={isSubmitting || !newTag.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </PopoverTrigger>
              {newTag.trim() && (
                <PopoverContent 
                  className="w-[var(--radix-popover-trigger-width)] p-0 border-[3px] border-foreground"
                  align="start"
                >
                  <Command>
                    <CommandList>
                      <CommandEmpty>
                        {exactMatch ? (
                          <div className="py-2 text-sm text-muted-foreground">
                            Press Enter or click + to add "{newTag.trim()}"
                          </div>
                        ) : (
                          <div className="py-2 text-sm text-muted-foreground">
                            Press Enter or click + to create "{newTag.trim()}"
                          </div>
                        )}
                      </CommandEmpty>
                      {filteredTags.length > 0 && (
                        <CommandGroup heading="Existing Tags">
                          {filteredTags.slice(0, 10).map((tag) => (
                            <CommandItem
                              key={tag}
                              value={tag}
                              onSelect={() => handleTagSelect(tag)}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  tags.some(t => t.toLowerCase() === tag.toLowerCase()) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {tag}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                      {!exactMatch && newTag.trim() && (
                        <CommandGroup heading="Create New Tag">
                          <CommandItem
                            value={newTag.trim()}
                            onSelect={() => addTag()}
                            className="cursor-pointer font-semibold"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create "{newTag.trim()}"
                          </CommandItem>
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              )}
            </Popover>
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
                setTagPopoverOpen(false);
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

