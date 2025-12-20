import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Trash2 } from "lucide-react";
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
      
      const { data } = await supabase
        .from("reactions")
        .select("reaction_type")
        .eq("post_id", post.id)
        .eq("user_id", user.id)
        .single();

      if (data) {
        setUserReaction(data.reaction_type);
      } else {
        setUserReaction(null);
      }
    };

    fetchUserReaction();
  }, [user, post.id]);

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
        .single();

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

