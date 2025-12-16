import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { ThumbsUp, ThumbsDown, Trash2 } from "lucide-react";
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
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const isOwnPost = user?.id === author_id;

  // Fetch user's reaction for this post
  useEffect(() => {
    const fetchUserReaction = async () => {
      if (!user || !id) return;
      
      const { data } = await supabase
        .from("reactions")
        .select("reaction_type")
        .eq("post_id", id)
        .eq("user_id", user.id)
        .single();

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
      // Check if user already has a reaction
      const { data: existingReaction } = await supabase
        .from("reactions")
        .select("id, reaction_type")
        .eq("post_id", id)
        .eq("user_id", user.id)
        .single();

      if (existingReaction) {
        if (existingReaction.reaction_type === reactionType) {
          // Remove reaction if clicking the same one
          const { error } = await supabase
            .from("reactions")
            .delete()
            .eq("post_id", id)
            .eq("user_id", user.id);

          if (error) throw error;
          setUserReaction(null);
        } else {
          // Replace reaction if clicking different one
          const { error } = await supabase
            .from("reactions")
            .update({ reaction_type: reactionType })
            .eq("post_id", id)
            .eq("user_id", user.id);

          if (error) throw error;
          setUserReaction(reactionType);
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
      className={`${sizeClasses[size]} p-5 flex flex-col hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] cursor-pointer relative`}
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
        <span className="text-xs text-muted-foreground font-mono">{timestamp}</span>
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
