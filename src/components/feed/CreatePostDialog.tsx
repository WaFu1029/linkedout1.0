import { useState, useMemo, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { X, Plus, Loader2, Check, Edit2 } from "lucide-react";
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

  // Fetch user's posting streak data and garden points
  const { data: profileData } = useQuery({
    queryKey: ["profile-posting-streak", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("posting_streak, last_post_date, garden_points")
        .eq("id", userId)
        .single();
      
      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      return data;
    },
    enabled: open && !!userId, // Only fetch when dialog is open and userId exists
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  // Fetch count of posts made today
  const { data: postsTodayCount = 0 } = useQuery({
    queryKey: ["posts-today-count", userId],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStart = tomorrow.toISOString();

      const { count, error } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("author_id", userId)
        .gte("created_at", todayStart)
        .lt("created_at", tomorrowStart);
      
      if (error) {
        console.error("Error counting posts today:", error);
        return 0;
      }
      return count || 0;
    },
    enabled: open && !!userId,
    staleTime: 10 * 1000, // Cache for 10 seconds
  });

  // Calculate if this post will contribute to streak
  const willContributeToStreak = useMemo(() => {
    if (!profileData) return null;
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const lastPostDate = profileData.last_post_date;
    
    // If no last post date, this will be the first post (contributes to streak)
    if (!lastPostDate) {
      return true;
    }
    
    // If already posted today, this won't contribute to streak
    if (lastPostDate === today) {
      return false;
    }
    
    // Otherwise, this will contribute to streak
    return true;
  }, [profileData]);

  // Calculate points for this post
  const pointsForThisPost = useMemo(() => {
    const postNumber = postsTodayCount + 1; // This will be the Nth post today
    
    // Only first 3 posts get points
    if (postNumber > 3) {
      return 0;
    }

    // Base points: 40, 20, 10
    const basePoints = postNumber === 1 ? 40 : postNumber === 2 ? 20 : 10;
    
    // Bonus: +2 points per consecutive day of posting streak
    // Day 1: streak = 1, bonus = 0 (40, 20, 10)
    // Day 2: streak = 2, bonus = 2 (42, 22, 12)
    // Day 3: streak = 3, bonus = 4 (44, 24, 14)
    // Formula: (streak - 1) * 2
    let effectiveStreak = profileData?.posting_streak || 0;
    
    if (willContributeToStreak) {
      // Calculate what the new streak will be (matching handleSubmit logic)
      const today = new Date().toISOString().split('T')[0];
      const lastPostDate = profileData?.last_post_date;
      
      if (!lastPostDate) {
        // First post ever - streak will be 1
        effectiveStreak = 1;
      } else {
        // Check if last post was yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastPostDate === yesterdayStr) {
          // Consecutive day - streak will increment
          effectiveStreak = effectiveStreak + 1;
        } else {
          // Streak broken - streak will reset to 1
          effectiveStreak = 1;
        }
      }
    }
    // If not contributing to streak, use current streak
    
    const streakBonus = Math.max(0, (effectiveStreak - 1) * 2);
    
    return basePoints + streakBonus;
  }, [postsTodayCount, profileData?.posting_streak, profileData?.last_post_date, willContributeToStreak]);

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

      // Update posting streak and award points
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Count posts made today BEFORE this one (to determine which post number this is)
      const todayStart = new Date(today + 'T00:00:00.000Z').toISOString();
      const tomorrowStart = new Date(today + 'T23:59:59.999Z');
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      const tomorrowStartISO = tomorrowStart.toISOString();
      
      // Count posts BEFORE this one was inserted (exclude the post we just created by using created_at < now)
      // Actually, since we just inserted, we need to count all posts today, then subtract 1, or count excluding this post's ID
      const { count: postsTodayBeforeThis } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("author_id", userId)
        .gte("created_at", todayStart)
        .lt("created_at", tomorrowStartISO)
        .neq("id", data.id); // Exclude the post we just created
      
      const postNumber = (postsTodayBeforeThis || 0) + 1; // This is the Nth post today
      
      const { data: profileData } = await supabase
        .from("profiles")
        .select("posting_streak, last_post_date, garden_points")
        .eq("id", userId)
        .single();

      if (profileData) {
        const lastPostDate = profileData.last_post_date;
        let newStreak = profileData.posting_streak || 0;
        let willContributeToStreak = false;

        if (!lastPostDate) {
          // First post - start streak at 1
          newStreak = 1;
          willContributeToStreak = true;
        } else if (lastPostDate === today) {
          // Already posted today - don't update streak
          // Keep current streak
          willContributeToStreak = false;
        } else {
          // Check if last post was yesterday
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (lastPostDate === yesterdayStr) {
            // Consecutive day - increment streak
            newStreak = (profileData.posting_streak || 0) + 1;
            willContributeToStreak = true;
          } else {
            // Streak broken - reset to 1
            newStreak = 1;
            willContributeToStreak = true;
          }
        }

        // Calculate points for this post (only first 3 posts get points)
        let pointsToAward = 0;
        if (postNumber <= 3) {
          // Base points: 40, 20, 10
          const basePoints = postNumber === 1 ? 40 : postNumber === 2 ? 20 : 10;
          
          // Bonus: +2 points per consecutive day of posting streak
          // Day 1: streak = 1, bonus = 0 (40, 20, 10)
          // Day 2: streak = 2, bonus = 2 (42, 22, 12)
          // Day 3: streak = 3, bonus = 4 (44, 24, 14)
          // Formula: (streak - 1) * 2
          const effectiveStreak = willContributeToStreak ? newStreak : (profileData.posting_streak || 0);
          const streakBonus = Math.max(0, (effectiveStreak - 1) * 2);
          
          pointsToAward = basePoints + streakBonus;
          
          console.log("Points calculation:", {
            postNumber,
            basePoints,
            effectiveStreak,
            streakBonus,
            pointsToAward,
            willContributeToStreak,
            newStreak,
            currentStreak: profileData.posting_streak
          });
        } else {
          console.log("No points - post number > 3:", postNumber);
        }

        // Update streak, last post date, and points
        const updateData: any = {};
        
        // Update streak and last_post_date if this is a new day
        if (lastPostDate !== today) {
          updateData.posting_streak = newStreak;
          updateData.last_post_date = today;
        }
        
        // Always update points if we're awarding them (even if already posted today)
        if (pointsToAward > 0) {
          updateData.garden_points = (profileData.garden_points || 0) + pointsToAward;
        }

        console.log("Update data:", updateData);
        console.log("Points to award:", pointsToAward);
        
        if (Object.keys(updateData).length > 0) {
          const { error: updateError, data: updateResult } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", userId)
            .select();

          if (updateError) {
            console.error("Error updating profile (streak/points):", updateError);
            console.error("Update data:", updateData);
            // Don't fail the whole operation, but log the error
            toast.error("Post created, but failed to update streak/points. Please refresh.");
          } else {
            console.log("Profile updated successfully:", updateResult);
            // Invalidate profile queries to refresh UI
            queryClient.invalidateQueries({ queryKey: ["profile"] });
            queryClient.invalidateQueries({ queryKey: ["profile-posting-streak", userId] });
            queryClient.invalidateQueries({ queryKey: ["posts-today-count", userId] });
          }
        } else {
          console.log("No update data - skipping profile update");
        }
        
        // Show points notification if awarded
        if (pointsToAward > 0) {
          toast.success(`+${pointsToAward} points! Your failure has been shared!`);
        } else {
          toast.success("Your failure has been shared!");
        }
      } else {
        toast.success("Your failure has been shared!");
      }
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

        {/* Posting Streak and Points Indicator */}
        {willContributeToStreak !== null && (
          <div className="mt-4 space-y-2">
            {willContributeToStreak ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 border-[2px] border-purple-500 rounded-md">
                <Edit2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  This post will contribute to your posting streak!
                  {profileData?.posting_streak !== null && profileData?.posting_streak !== undefined && (
                    <span className="ml-1">
                      (Current streak: {profileData.posting_streak} day{profileData.posting_streak !== 1 ? 's' : ''})
                    </span>
                  )}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 border-[2px] border-gray-400 dark:border-gray-600 rounded-md">
                <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  You've already posted today. This post won't contribute to your posting streak.
                </span>
              </div>
            )}
            
            {/* Points Indicator */}
            {pointsForThisPost !== null && pointsForThisPost !== undefined && (
              <div className={`flex items-center gap-2 px-4 py-2 border-[2px] rounded-md ${
                pointsForThisPost > 0 
                  ? "bg-green-100 dark:bg-green-900/30 border-green-500" 
                  : "bg-gray-100 dark:bg-gray-800 border-gray-400 dark:border-gray-600"
              }`}>
                <span className={`text-sm font-semibold ${
                  pointsForThisPost > 0 
                    ? "text-green-700 dark:text-green-300" 
                    : "text-gray-700 dark:text-gray-300"
                }`}>
                  {pointsForThisPost > 0 ? (
                    <>
                      This post will earn you <span className="font-bold">+{pointsForThisPost} points</span>
                      {postsTodayCount === 0 && " (1st post today)"}
                      {postsTodayCount === 1 && " (2nd post today)"}
                      {postsTodayCount === 2 && " (3rd post today)"}
                      {postsTodayCount >= 3 && " (4th+ post today - no points)"}
                    </>
                  ) : (
                    <>
                      This post won't earn points (4th+ post today)
                    </>
                  )}
                </span>
              </div>
            )}
          </div>
        )}

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

