import { useState, useMemo, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { X, Plus, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const tagInputRef = useRef<HTMLInputElement>(null);
  const highlightedItemRefs = useRef<(HTMLDivElement | null)[]>([]);

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
    setHighlightedIndex(-1); // Reset highlight when typing
    // Clear refs when input changes
    highlightedItemRefs.current = [];
  };

  // Calculate total number of selectable items
  const totalItems = useMemo(() => {
    let count = filteredTags.length;
    if (!exactMatch && newTag.trim()) {
      count += 1; // Add "Create New Tag" option
    }
    return count;
  }, [filteredTags.length, exactMatch, newTag]);

  // Reset highlighted index when popover closes
  useEffect(() => {
    if (!tagPopoverOpen) {
      setHighlightedIndex(-1);
      highlightedItemRefs.current = [];
    }
  }, [tagPopoverOpen]);

  const handleTagSelect = (tag: string) => {
    addTag(tag);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (tagPopoverOpen && totalItems > 0) {
        setHighlightedIndex((prev) => {
          const next = prev < totalItems - 1 ? prev + 1 : 0;
          // Scroll into view
          setTimeout(() => {
            highlightedItemRefs.current[next]?.scrollIntoView({
              block: "nearest",
              behavior: "smooth",
            });
          }, 0);
          return next;
        });
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (tagPopoverOpen && totalItems > 0) {
        setHighlightedIndex((prev) => {
          const next = prev <= 0 ? totalItems - 1 : prev - 1;
          // Scroll into view
          setTimeout(() => {
            highlightedItemRefs.current[next]?.scrollIntoView({
              block: "nearest",
              behavior: "smooth",
            });
          }, 0);
          return next;
        });
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredTags.length) {
        // Select highlighted existing tag
        handleTagSelect(filteredTags[highlightedIndex]);
        setHighlightedIndex(-1);
      } else if (highlightedIndex === filteredTags.length && !exactMatch && newTag.trim()) {
        // Select "Create New Tag" option
        addTag();
        setHighlightedIndex(-1);
      } else if (newTag.trim()) {
        // Fallback: add current input as tag
        addTag();
        setHighlightedIndex(-1);
      } else if (filteredTags.length > 0) {
        // Select first suggestion if nothing highlighted
        handleTagSelect(filteredTags[0]);
        setHighlightedIndex(-1);
      }
    } else if (e.key === "Escape") {
      setTagPopoverOpen(false);
      setHighlightedIndex(-1);
    } else {
      // Reset highlight when typing other keys
      if (highlightedIndex >= 0) {
        setHighlightedIndex(-1);
      }
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

      // Update posting streak
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const { data: profileData } = await supabase
        .from("profiles")
        .select("posting_streak, last_post_date")
        .eq("id", userId)
        .single();

      if (profileData) {
        const lastPostDate = profileData.last_post_date;
        let newStreak = profileData.posting_streak || 0;

        if (!lastPostDate) {
          // First post - start streak at 1
          newStreak = 1;
        } else if (lastPostDate === today) {
          // Already posted today - don't update streak
          // Keep current streak
        } else {
          // Check if last post was yesterday
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (lastPostDate === yesterdayStr) {
            // Consecutive day - increment streak
            newStreak = (profileData.posting_streak || 0) + 1;
          } else {
            // Streak broken - reset to 1
            newStreak = 1;
          }
        }

        // Update streak and last post date if needed
        if (lastPostDate !== today) {
          await supabase
            .from("profiles")
            .update({
              posting_streak: newStreak,
              last_post_date: today,
            })
            .eq("id", userId);

          // Invalidate profile queries to refresh UI
          queryClient.invalidateQueries({ queryKey: ["profile"] });
        }
      }

      toast.success("Your failure has been shared!");
      setTitle("");
      setContent("");
      setTags([]);
      setNewTag("");
      setTagPopoverOpen(false);
      setHighlightedIndex(-1);
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
            <Popover open={tagPopoverOpen && newTag.trim().length > 0} onOpenChange={setTagPopoverOpen}>
              <div className="flex gap-2 max-w-xs">
                <PopoverTrigger asChild>
                  <div className="flex-1 relative" style={{ pointerEvents: 'auto' }}>
                    <Input
                      ref={tagInputRef}
                      value={newTag}
                      onChange={(e) => {
                        handleTagInputChange(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        handleTagInputKeyDown(e);
                      }}
                      onFocus={() => newTag.trim() && setTagPopoverOpen(true)}
                      onBlur={(e) => {
                        // Delay closing to allow clicks on popover items
                        setTimeout(() => {
                          if (!e.currentTarget.contains(document.activeElement)) {
                            setTagPopoverOpen(false);
                          }
                        }, 200);
                      }}
                      placeholder="Search or add tag..."
                      className="shadow-none w-full"
                      disabled={isSubmitting}
                      autoComplete="off"
                      style={{ pointerEvents: 'auto' }}
                    />
                  </div>
                </PopoverTrigger>
                <Button
                  onClick={() => addTag()}
                  className="border-[3px] border-foreground shadow-none"
                  type="button"
                  disabled={isSubmitting || !newTag.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <PopoverContent 
                className="w-[300px] p-0 border-[3px] border-foreground max-h-[300px] overflow-y-auto"
                align="start"
                side="bottom"
                sideOffset={4}
                onOpenAutoFocus={(e) => e.preventDefault()}
                onInteractOutside={(e) => {
                  // Don't close if clicking on the input
                  if (tagInputRef.current?.contains(e.target as Node)) {
                    e.preventDefault();
                  }
                }}
                onCloseAutoFocus={(e) => {
                  e.preventDefault();
                  tagInputRef.current?.focus();
                }}
              >
                <div className="p-1">
                  {filteredTags.length === 0 ? (
                    <div className="py-2 px-2 text-sm text-muted-foreground">
                      {exactMatch ? (
                        <>Press Enter or click + to add "{newTag.trim()}"</>
                      ) : (
                        <>Press Enter or click + to create "{newTag.trim()}"</>
                      )}
                    </div>
                  ) : null}
                  {filteredTags.length > 0 && (
                    <div>
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        Existing Tags
                      </div>
                      {filteredTags.slice(0, 10).map((tag, index) => {
                        const isHighlighted = highlightedIndex === index;
                        const isSelected = tags.some(t => t.toLowerCase() === tag.toLowerCase());
                        return (
                          <div
                            key={tag}
                            ref={(el) => {
                              highlightedItemRefs.current[index] = el;
                            }}
                            onClick={() => {
                              handleTagSelect(tag);
                              setHighlightedIndex(-1);
                            }}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            className={cn(
                              "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                              isHighlighted && "bg-accent text-accent-foreground",
                              isSelected && "bg-accent"
                            )}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                isSelected ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {tag}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {!exactMatch && newTag.trim() && (
                    <div>
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        Create New Tag
                      </div>
                      <div
                        ref={(el) => {
                          highlightedItemRefs.current[filteredTags.length] = el;
                        }}
                        onClick={() => {
                          addTag();
                          setHighlightedIndex(-1);
                        }}
                        onMouseEnter={() => setHighlightedIndex(filteredTags.length)}
                        className={cn(
                          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm font-semibold outline-none hover:bg-accent hover:text-accent-foreground",
                          highlightedIndex === filteredTags.length && "bg-accent text-accent-foreground"
                        )}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create "{newTag.trim()}"
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
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
                setHighlightedIndex(-1);
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

