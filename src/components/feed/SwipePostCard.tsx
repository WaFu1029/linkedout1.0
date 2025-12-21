import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Trash2, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
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

interface Reaction {
  like?: number;
  dislike?: number;
}

interface Post {
  id: string;
  author: string;
  industry: string;
  title?: string | null;
  content: string;
  tags?: string[];
  timestamp: string;
  reactions?: Reaction;
  author_id?: string;
}

interface SwipePostCardProps {
  post: Post;
  currentUserEmail?: string | null;
  comments?: Array<{ id: string; text: string; author?: string }>;
  isMobile?: boolean;
}

export function SwipePostCard({ post, currentUserEmail, comments = [], isMobile = false }: SwipePostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
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

  const isOwnPost = user?.id === post.author_id;

  const reactions = post.reactions || { like: 0, dislike: 0 };
  const postComments = comments.filter((c) => c.id === post.id);
  const firstName = post.author?.split(" ")[0] || post.author;

  // Fetch user's reaction for this post
  useEffect(() => {
    const fetchUserReaction = async () => {
      if (!user || !post.id) return;
      
      const { data, error } = await supabase
        .from("reactions")
        .select("reaction_type")
        .eq("post_id", post.id)
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
  }, [user, post.id]);

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
    if (!user || !post.author_id || isOwnPost || isGifting) return;

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
        .eq("id", post.author_id)
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
        .eq("id", post.author_id);

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
        const { error: giftsError } = await supabase
          .from("gifts")
          .insert({
            gifter_id: user.id,
            recipient_id: post.author_id,
            emoji: emoji,
            quantity: quantity,
            post_id: post.id, // Track which post this gift came from
          });

        if (giftsError) {
          console.error("Error creating gift records:", giftsError);
          // Don't throw - gift was successful, notification is secondary
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
      
      toast.success(`Gifted ${quantity}x ${emoji} to ${firstName}!`);
    } catch (error) {
      console.error("Error gifting to post author:", error);
      toast.error("Failed to send gift. Please try again.");
    } finally {
      setIsGifting(false);
    }
  };

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
    
    if (!post.id || isReacting) return;

    setIsReacting(true);
    try {
      // Get post author to check if user is trying to like their own post
      const { data: postData } = await supabase
        .from("posts")
        .select("author_id")
        .eq("id", post.id)
        .single();

      if (!postData) {
        throw new Error("Post not found");
      }

      const isOwnPost = user.id === postData.author_id;

      // Check if user already has a reaction
      const { data: existingReaction } = await supabase
        .from("reactions")
        .select("id, reaction_type")
        .eq("post_id", post.id)
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
            .eq("post_id", post.id)
            .eq("user_id", user.id);

          if (error) throw error;
          setUserReaction(null);
        } else {
          // Replace reaction if clicking different one
          wasLiking = existingReaction.reaction_type === 'like';
          const { error } = await supabase
            .from("reactions")
            .update({ reaction_type: reactionType })
            .eq("post_id", post.id)
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
            post_id: post.id,
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
          .eq("post_id", post.id)
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
                  post_id: post.id,
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

  const handleComment = () => {
    if (!user) {
      toast.error("Create an account to interact with other users", {
        action: {
          label: "Sign Up",
          onClick: () => navigate("/auth?mode=signup"),
        },
      });
      return;
    }
    
    if (newComment.trim() && newComment.split(/\s+/).length <= 3) {
      // TODO: Implement comment logic with Supabase
      console.log("Comment:", newComment);
      setNewComment("");
    }
  };

  const wordCount = newComment.trim().split(/\s+/).filter(Boolean).length;

  const handleDelete = async () => {
    if (!user || !post.id || !isOwnPost) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", post.id)
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
    <Card className={`p-6 flex flex-col ${isMobile ? "h-full overflow-y-auto" : "h-full"} relative`}>
      {/* Author - only on mobile since desktop has sidebar */}
      {isMobile && (
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="font-bold text-xl">{firstName}</p>
            <p className="text-sm font-semibold text-primary font-mono">{post.industry}</p>
          </div>
          {isOwnPost && (
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="p-2 hover:bg-secondary border-[3px] border-foreground transition-colors"
              aria-label="Delete post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Delete button for desktop */}
      {!isMobile && isOwnPost && (
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="p-2 hover:bg-secondary border-[3px] border-foreground transition-colors"
            aria-label="Delete post"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Title */}
      {post.title && (
        <h2 className="font-bold text-3xl mb-3">{post.title}</h2>
      )}

      {/* Content */}
      <p className="font-medium text-2xl leading-relaxed mb-5 flex-grow">{post.content}</p>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag, i) => (
            <span
              key={i}
              className="bg-primary text-primary-foreground px-3 py-1.5 text-xs font-bold border-[3px] border-foreground shadow-brutal"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Timestamp */}
      <p className="text-xs font-semibold text-muted-foreground mb-4 font-mono">
        {post.timestamp || "Just now"}
      </p>

      {/* Reactions */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => handleReaction('like')}
          disabled={isReacting}
          className={`px-3 py-2 border-[3px] border-foreground font-semibold text-sm shadow-brutal transition-all flex items-center gap-2 ${
            !user 
              ? "opacity-50 cursor-not-allowed" 
              : "hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px]"
          } ${
            userReaction === 'like'
              ? isDark 
                ? "bg-[#a78bfa] text-white hover:bg-[#8b5cf6]" 
                : "bg-[#f97316] text-white hover:bg-[#ea580c]"
              : "bg-background hover:bg-secondary"
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span>Like</span>
          {reactions.like > 0 && <span>· {reactions.like}</span>}
        </button>
        <button
          onClick={() => handleReaction('dislike')}
          disabled={isReacting}
          className={`px-3 py-2 border-[3px] border-foreground font-semibold text-sm shadow-brutal transition-all flex items-center gap-2 ${
            !user 
              ? "opacity-50 cursor-not-allowed" 
              : "hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px]"
          } ${
            userReaction === 'dislike'
              ? isDark 
                ? "bg-[#a78bfa] text-white hover:bg-[#8b5cf6]" 
                : "bg-[#f97316] text-white hover:bg-[#ea580c]"
              : "bg-background hover:bg-secondary"
          }`}
        >
          <ThumbsDown className="w-4 h-4" />
          <span>Dislike</span>
          {reactions.dislike > 0 && <span>· {reactions.dislike}</span>}
        </button>
        {!isOwnPost && user && (
          <button
            onClick={() => setShowGiftDialog(true)}
            disabled={isGifting}
            className="px-3 py-2 border-[3px] border-foreground font-semibold text-sm shadow-brutal transition-all flex items-center gap-2 hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            <Gift className="w-4 h-4" />
            Gift
          </button>
        )}
      </div>

      {/* Comments */}
      <button
        onClick={() => setShowComments(!showComments)}
        className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        {postComments.length} Comments
        {showComments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showComments && (
        <div className="mt-4 pt-4 border-t-[3px] border-dashed border-foreground">
          {postComments.length > 0 ? (
            postComments.map((comment, i) => (
              <div key={i} className="mb-2 bg-secondary p-3 border-[3px] border-foreground">
                {comment.author && (
                  <p className="font-bold text-xs text-primary mb-1">{comment.author}</p>
                )}
                <p className="text-sm font-medium">{comment.text}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic">No comments yet</p>
          )}

          <div className="flex gap-2 mt-3">
            <Input
              value={user ? newComment : ""}
              onChange={(e) => {
                if (!user) {
                  toast.error("Create an account to interact with other users", {
                    action: {
                      label: "Sign Up",
                      onClick: () => navigate("/auth?mode=signup"),
                    },
                  });
                  return;
                }
                setNewComment(e.target.value);
              }}
              placeholder="3 words max..."
              onKeyDown={(e) => {
                if (!user) {
                  e.preventDefault();
                  toast.error("Create an account to interact with other users", {
                    action: {
                      label: "Sign Up",
                      onClick: () => navigate("/auth?mode=signup"),
                    },
                  });
                  return;
                }
                if (e.key === "Enter") handleComment();
              }}
              onClick={() => {
                if (!user) {
                  toast.error("Create an account to interact with other users", {
                    action: {
                      label: "Sign Up",
                      onClick: () => navigate("/auth?mode=signup"),
                    },
                  });
                }
              }}
              className={`border-[3px] border-foreground ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={!user}
            />
            <Button
              onClick={handleComment}
              disabled={!user || wordCount === 0 || wordCount > 3}
              className={`border-[3px] border-foreground shadow-brutal ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Post
            </Button>
          </div>
          {wordCount > 3 && (
            <p className="text-destructive text-xs font-bold mt-2">Max 3 words!</p>
          )}
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
            <DialogTitle className="text-2xl text-white">Gift to {firstName}</DialogTitle>
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
                  <p className="text-sm text-gray-300 mb-2">Gift {selectedGiftItem} to {firstName}:</p>
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

