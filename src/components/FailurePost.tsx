import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { ThumbsUp, ThumbsDown, Trash2, Gift } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface FailurePostProps {
  id: string;
  author: string;
  industry: string;
  title?: string | null;
  content: string;
  tags: string[];
  timestamp: string;
  reactions: {
    like: number;
    dislike: number;
  };
  comments?: { text: string }[];
  size?: "sm" | "md" | "lg" | "tall" | "wide";
  author_id?: string;
}

const sizeClasses = {
  sm: "col-span-1 row-span-1",
  md: "col-span-1 row-span-1 md:col-span-2",
  lg: "col-span-1 row-span-2 md:col-span-2",
  tall: "col-span-1 row-span-2",
  wide: "col-span-1 md:col-span-2 row-span-1",
};

export function FailurePost({
  id,
  author,
  industry,
  title,
  content,
  tags,
  timestamp,
  reactions,
  comments = [],
  size = "sm",
  author_id,
}: FailurePostProps) {
  const [isReacting, setIsReacting] = useState(false);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showGiftDialog, setShowGiftDialog] = useState(false);
  const [userInventory, setUserInventory] = useState<Array<{emoji: string, count: number}>>([]);
  const [selectedGiftItem, setSelectedGiftItem] = useState<string | null>(null);
  const [giftQuantity, setGiftQuantity] = useState(1);
  const [isGifting, setIsGifting] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const isOwnPost = user?.id === author_id;

  // Fetch user's inventory when gift dialog opens
  useEffect(() => {
    const fetchInventory = async () => {
      if (!showGiftDialog || !user || isOwnPost) return;

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("inventory")
          .eq("id", user.id)
          .single();

        if (profile?.inventory && Array.isArray(profile.inventory)) {
          const cleanInventory = profile.inventory.map((item: any) => ({
            emoji: item.emoji,
            count: typeof item.count === 'number' ? item.count : 1
          }));
          setUserInventory(cleanInventory);
        } else {
          setUserInventory([]);
        }
      } catch (error) {
        console.error("Error fetching inventory:", error);
        setUserInventory([]);
      }
    };

    fetchInventory();
  }, [showGiftDialog, user, isOwnPost]);

  const handleGiftToPostAuthor = async (emoji: string, quantity: number) => {
    if (!user || !author_id || isOwnPost || isGifting) return;

    // Check if user has enough of this vegetable in inventory
    const inventoryItem = userInventory.find(item => item.emoji === emoji);
    if (!inventoryItem || inventoryItem.count < quantity) {
      toast.error(`You don't have enough ${emoji}! You have ${inventoryItem?.count || 0}, trying to gift ${quantity}.`);
      return;
    }

    setIsGifting(true);
    try {
      // Fetch recipient's inventory
      const { data: recipientProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("inventory, gifts_received")
        .eq("id", author_id)
        .single();

      if (fetchError) {
        console.error("Error fetching recipient profile:", fetchError);
        throw fetchError;
      }
      if (!recipientProfile) {
        toast.error("User not found");
        return;
      }

      // Parse recipient's inventory
      let recipientInventory: Array<{emoji: string, count: number}> = [];
      if (recipientProfile.inventory && Array.isArray(recipientProfile.inventory)) {
        recipientInventory = recipientProfile.inventory.map((item: any) => ({
          emoji: item.emoji,
          count: typeof item.count === 'number' ? item.count : 1
        }));
      }

      // Add gifts to recipient's inventory
      const existingItem = recipientInventory.find(item => item.emoji === emoji);
      let newRecipientInventory: Array<{emoji: string, count: number}>;
      
      if (existingItem) {
        newRecipientInventory = recipientInventory.map(item =>
          item.emoji === emoji
            ? { ...item, count: item.count + quantity }
            : item
        );
      } else {
        newRecipientInventory = [...recipientInventory, { emoji, count: quantity }];
      }

      const cleanRecipientInventory = newRecipientInventory.map(item => ({
        emoji: item.emoji,
        count: item.count
      }));

      // Update gifter's inventory (decrement by quantity, remove if 0)
      const newInventory = userInventory.map(item => {
        if (item.emoji === emoji) {
          return { ...item, count: item.count - quantity };
        }
        return item;
      }).filter(item => item.count > 0);

      const cleanInventory = newInventory.map(item => ({
        emoji: item.emoji,
        count: item.count
      }));

      // Update recipient's inventory and gifts_received
      const newGiftsReceived = (recipientProfile.gifts_received || 0) + quantity;
      const { error: recipientError } = await supabase
        .from("profiles")
        .update({
          inventory: cleanRecipientInventory,
          gifts_received: newGiftsReceived,
        })
        .eq("id", author_id);

      if (recipientError) throw recipientError;

      // Update gifter's inventory
      const { error: gifterError } = await supabase
        .from("profiles")
        .update({
          inventory: cleanInventory,
        })
        .eq("id", user.id);

      if (gifterError) throw gifterError;

      // Create gift record for notifications (one record per transaction with actual quantity)
      try {
        console.log("Creating gift record:", {
          gifter_id: user.id,
          recipient_id: author_id,
          emoji: emoji,
          quantity: quantity,
          post_id: id
        });
        
        const { data: giftData, error: giftsError } = await supabase
          .from("gifts")
          .insert({
            gifter_id: user.id,
            recipient_id: author_id,
            emoji: emoji,
            quantity: quantity,
            post_id: id, // Track which post this gift came from
          })
          .select()
          .single();

        if (giftsError) {
          console.error("Error creating gift records:", giftsError);
          console.error("Gift error details:", JSON.stringify(giftsError, null, 2));
          // Don't throw - gift was successful, notification is secondary
        } else {
          console.log("Gift record created successfully:", giftData);
        }
      } catch (giftRecordError) {
        console.error("Error creating gift records:", giftRecordError);
        // Don't throw - gift was successful
      }

      // Update local state
      setUserInventory(newInventory);
      setShowGiftDialog(false);
      setSelectedGiftItem(null);
      setGiftQuantity(1);
      
      toast.success(`Gifted ${quantity}x ${emoji} to ${author}!`);
    } catch (error) {
      console.error("Error gifting to post author:", error);
      toast.error("Failed to send gift. Please try again.");
    } finally {
      setIsGifting(false);
    }
  };

  // Fetch user's reaction for this post
  useEffect(() => {
    const fetchUserReaction = async () => {
      if (!user || !id) return;
      
      const { data, error } = await supabase
        .from("reactions")
        .select("reaction_type")
        .eq("post_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user reaction:", error);
        setUserReaction(null);
        return;
      }

      if (data) {
        setUserReaction(data.reaction_type);
      } else {
        setUserReaction(null);
      }
    };

    fetchUserReaction();
  }, [user, id]);

  const handleReaction = async (reactionType: 'like' | 'dislike') => {
    if (!user) {
      toast.error("Create an account to interact with other users", {
        action: {
          label: "Sign Up",
          onClick: () => navigate("/auth?mode=signup"),
        },
      });
      return;
    }
    
    if (!id || isReacting) return;

    setIsReacting(true);
    try {
      // Get post author to check if user is trying to like their own post
      const { data: postData } = await supabase
        .from("posts")
        .select("author_id")
        .eq("id", id)
        .single();

      if (!postData) {
        throw new Error("Post not found");
      }

      const isOwnPost = user.id === postData.author_id;

      // Check if user already has a reaction
      const { data: existingReaction } = await supabase
        .from("reactions")
        .select("id, reaction_type")
        .eq("post_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      let shouldAwardPoints = false;
      let wasLiking = false;

      if (existingReaction) {
        if (existingReaction.reaction_type === reactionType) {
          // Remove reaction if clicking the same one
          wasLiking = existingReaction.reaction_type === 'like';
          const { error } = await supabase
            .from("reactions")
            .delete()
            .eq("post_id", id)
            .eq("user_id", user.id);

          if (error) throw error;
          setUserReaction(null);
        } else {
          // Replace reaction if clicking different one
          wasLiking = existingReaction.reaction_type === 'like';
          const { error } = await supabase
            .from("reactions")
            .update({ reaction_type: reactionType })
            .eq("post_id", id)
            .eq("user_id", user.id);

          if (error) throw error;
          setUserReaction(reactionType);
          // If changing to like, check if we should award points
          if (reactionType === 'like' && !wasLiking) {
            shouldAwardPoints = true;
          }
        }
      } else {
        // Add new reaction
        const { error } = await supabase
          .from("reactions")
          .insert({
            post_id: id,
            user_id: user.id,
            reaction_type: reactionType,
          });

        if (error) throw error;
        setUserReaction(reactionType);
        // If it's a new like, check if we should award points
        if (reactionType === 'like') {
          shouldAwardPoints = true;
        }
      }

      // Award points if this is a new unique like from someone other than the author
      if (shouldAwardPoints && !isOwnPost) {
        // Check if this user has already given points for this post
        const { data: existingPoints } = await supabase
          .from("reaction_points_awarded")
          .select("id")
          .eq("post_id", id)
          .eq("user_id", user.id)
          .single();

        if (!existingPoints) {
          // Award points to post author
          const { data: authorProfile } = await supabase
            .from("profiles")
            .select("garden_points")
            .eq("id", postData.author_id)
            .single();

          if (authorProfile) {
            const newPoints = (authorProfile.garden_points || 0) + 10;
            const { error: pointsError } = await supabase
              .from("profiles")
              .update({ garden_points: newPoints })
              .eq("id", postData.author_id);

            if (!pointsError) {
              // Track that this user has given points for this post
              await supabase
                .from("reaction_points_awarded")
                .insert({
                  post_id: id,
                  user_id: user.id,
                  author_id: postData.author_id,
                  points_awarded: 10,
                });
            }
          }
        }
      }

      // Invalidate queries to refresh reactions
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["profile-posts"] });
    } catch (error) {
      console.error("Error handling reaction:", error);
    } finally {
      setIsReacting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !id || !isOwnPost) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", id)
        .eq("author_id", user.id);

      if (error) throw error;

      toast.success("Post deleted");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["profile-posts"] });
      queryClient.invalidateQueries({ queryKey: ["wall-posts"] });
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card
  className={`${sizeClasses[size]} p-5 flex flex-col relative`}
>
      {/* Delete button */}
      {isOwnPost && (
        <button
          onClick={() => setShowDeleteDialog(true)}
          className="absolute top-3 right-3 p-2 hover:bg-secondary border-[3px] border-foreground transition-colors z-10"
          aria-label="Delete post"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg">{author}</h3>
          <p className="text-sm text-muted-foreground font-mono">{industry}</p>
        </div>
      </div>

      {/* Title */}
      {title && (
        <h3 className="font-bold text-xl mb-2">{title}</h3>
      )}

      {/* Content */}
      <p className="flex-1 text-base leading-relaxed mb-4">{content}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag) => (
          <Badge key={tag} variant="tag">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Timestamp */}
      <p className="text-xs font-semibold text-muted-foreground mb-4 font-mono">
        {timestamp}
      </p>

      {/* Reactions */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Button 
          variant="reaction" 
          size="reaction"
          onClick={() => handleReaction("like")}
          disabled={isReacting}
          className={`flex items-center gap-2 ${!user ? "opacity-50 cursor-not-allowed" : ""} ${userReaction === "like" ? isDark ? "bg-[#a78bfa] text-white hover:bg-[#8b5cf6]" : "bg-[#f97316] text-white hover:bg-[#ea580c]" : ""}`}
        >
          <ThumbsUp className="w-4 h-4" />
          Like · {reactions.like || 0}
        </Button>
        <Button 
          variant="reaction" 
          size="reaction"
          onClick={() => handleReaction("dislike")}
          disabled={isReacting}
          className={`flex items-center gap-2 ${!user ? "opacity-50 cursor-not-allowed" : ""} ${userReaction === "dislike" ? isDark ? "bg-[#a78bfa] text-white hover:bg-[#8b5cf6]" : "bg-[#f97316] text-white hover:bg-[#ea580c]" : ""}`}
        >
          <ThumbsDown className="w-4 h-4" />
          Dislike · {reactions.dislike || 0}
        </Button>
        {!isOwnPost && user && (
          <Button 
            variant="reaction" 
            size="reaction"
            onClick={() => setShowGiftDialog(true)}
            disabled={isGifting}
            className="flex items-center gap-2"
          >
            <Gift className="w-4 h-4" />
            Gift
          </Button>
        )}
      </div>

      {/* Comments preview */}
      {comments.length > 0 && (
        <div className="border-t-[2px] border-foreground pt-3">
          {comments.slice(0, 2).map((comment, i) => (
            <p key={i} className="text-sm font-mono text-muted-foreground">
              "{comment.text}"
            </p>
          ))}
        </div>
      )}

      {/* Gift Dialog */}
      <Dialog open={showGiftDialog} onOpenChange={(open) => {
        setShowGiftDialog(open);
        if (!open) {
          setSelectedGiftItem(null);
          setGiftQuantity(1);
        }
      }}>
        <DialogContent className="border-[3px] border-foreground shadow-brutal max-w-2xl bg-[#1a1a1a]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">Gift to {author}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Select a vegetable from your inventory to gift
            </DialogDescription>
          </DialogHeader>

          {selectedGiftItem && (() => {
            const item = userInventory.find(i => i.emoji === selectedGiftItem);
            const maxQuantity = item?.count || 1;
            
            return (
              <div className="mb-4 p-4 bg-gray-800 border-[3px] border-foreground rounded space-y-3">
                <div>
                  <p className="text-sm text-gray-300 mb-2">Gift {selectedGiftItem} to {author}:</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGiftQuantity(Math.max(1, giftQuantity - 1))}
                      disabled={giftQuantity <= 1}
                      className="border-[3px] border-foreground"
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      max={maxQuantity}
                      value={giftQuantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setGiftQuantity(Math.max(1, Math.min(maxQuantity, val)));
                      }}
                      className="w-20 text-center border-[3px] border-foreground bg-gray-900 text-white"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGiftQuantity(Math.min(maxQuantity, giftQuantity + 1))}
                      disabled={giftQuantity >= maxQuantity}
                      className="border-[3px] border-foreground"
                    >
                      +
                    </Button>
                    <span className="text-sm text-gray-400 ml-2">(max: {maxQuantity})</span>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    if (selectedGiftItem) {
                      handleGiftToPostAuthor(selectedGiftItem, giftQuantity);
                    }
                  }}
                  disabled={isGifting}
                  className="w-full border-[3px] border-foreground"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  {isGifting ? "Sending..." : `Send Gift (${giftQuantity}x ${selectedGiftItem})`}
                </Button>
              </div>
            );
          })()}

          <div className="mt-4 p-4 bg-[#1a1a1a]">
            <div 
              className="grid gap-2"
              style={{ 
                gridTemplateColumns: 'repeat(8, 1fr)',
                gridTemplateRows: 'repeat(4, 1fr)'
              }}
            >
              {Array.from({ length: 32 }).map((_, index) => {
                const item = index < userInventory.length ? userInventory[index] : null;
                
                if (!item) {
                  return (
                    <div
                      key={index}
                      className="aspect-square border-2 bg-gray-950 border-gray-800 border-t-gray-900 border-l-gray-900 border-b-gray-700 border-r-gray-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                    />
                  );
                }
                
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedGiftItem(item.emoji);
                      setGiftQuantity(1);
                    }}
                    className={`aspect-square border-2 flex items-center justify-center relative transition-all bg-gray-800 border-gray-600 border-t-gray-500 border-l-gray-500 border-b-gray-700 border-r-gray-700 hover:bg-gray-700 cursor-pointer shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] ${
                      selectedGiftItem === item.emoji ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    {item.count > 1 && (
                      <span className="absolute bottom-0 right-0 bg-gray-900 text-white text-xs font-bold px-1 rounded border border-gray-700">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-[3px] border-foreground shadow-brutal bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Delete Post?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-[3px] border-foreground shadow-brutal">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground border-[3px] border-foreground shadow-brutal"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
