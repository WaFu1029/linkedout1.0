import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";

interface Reaction {
  same?: number;
  itsOk?: number;
  youreDoingGreat?: number;
  youGotThis?: number;
}

interface Post {
  id: string;
  author: string;
  industry: string;
  content: string;
  tags?: string[];
  timestamp: string;
  reactions?: Reaction;
}

interface SwipePostCardProps {
  post: Post;
  currentUserEmail?: string | null;
  comments?: Array<{ id: string; text: string; author?: string }>;
  isMobile?: boolean;
}

const REACTIONS = [
  { key: "same" as const, label: "Same", emoji: "🫠" },
  { key: "itsOk" as const, label: "It's ok", emoji: "👍" },
  { key: "youreDoingGreat" as const, label: "You're doing great!", emoji: "💪" },
  { key: "youGotThis" as const, label: "You got this!", emoji: "🔥" },
];

export function SwipePostCard({ post, currentUserEmail, comments = [], isMobile = false }: SwipePostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isReacting, setIsReacting] = useState(false);
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const reactions = post.reactions || {};
  const postComments = comments.filter((c) => c.id === post.id);
  const firstName = post.author?.split(" ")[0] || post.author;

  // Fetch user's reactions for this post
  useEffect(() => {
    const fetchUserReactions = async () => {
      if (!user || !post.id) return;
      
      const { data } = await supabase
        .from("reactions")
        .select("reaction_type")
        .eq("post_id", post.id)
        .eq("user_id", user.id);

      if (data) {
        setUserReactions(new Set(data.map((r) => r.reaction_type)));
      }
    };

    fetchUserReactions();
  }, [user, post.id]);

  const handleReaction = async (reactionKey: keyof Reaction) => {
    if (!user || !post.id || isReacting) return;

    setIsReacting(true);
    try {
      // Check if user already has this reaction
      const { data: existingReaction } = await supabase
        .from("reactions")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", user.id)
        .eq("reaction_type", reactionKey)
        .single();

      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from("reactions")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id)
          .eq("reaction_type", reactionKey);

        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from("reactions")
          .insert({
            post_id: post.id,
            user_id: user.id,
            reaction_type: reactionKey,
          });

        if (error) throw error;
      }

      // Update local state immediately for visual feedback
      const newUserReactions = new Set(userReactions);
      if (existingReaction) {
        newUserReactions.delete(reactionKey);
      } else {
        newUserReactions.add(reactionKey);
      }
      setUserReactions(newUserReactions);

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
    if (newComment.trim() && newComment.split(/\s+/).length <= 3) {
      // TODO: Implement comment logic with Supabase
      console.log("Comment:", newComment);
      setNewComment("");
    }
  };

  const wordCount = newComment.trim().split(/\s+/).filter(Boolean).length;

  return (
    <Card className={`p-6 flex flex-col ${isMobile ? "h-full overflow-y-auto" : "h-full"}`}>
      {/* Author - only on mobile since desktop has sidebar */}
      {isMobile && (
        <div className="mb-4">
          <p className="font-bold text-xl">{firstName}</p>
          <p className="text-sm font-semibold text-primary font-mono">{post.industry}</p>
        </div>
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
        {REACTIONS.map(({ key, label, emoji }) => {
          const count = reactions[key] || 0;
          const isActive = userReactions.has(key);
          return (
            <button
              key={key}
              onClick={() => handleReaction(key)}
              disabled={!user || isReacting}
              className={`px-3 py-2 border-[3px] border-foreground font-semibold text-sm shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isActive 
                  ? isDark 
                    ? "bg-[#a78bfa] text-white hover:bg-[#8b5cf6]" 
                    : "bg-[#f97316] text-white hover:bg-[#ea580c]"
                  : "bg-background hover:bg-secondary"
              }`}
            >
              <span className="mr-1">{emoji}</span>
              <span className="hidden sm:inline">{label}</span>
              {count > 0 && <span className="ml-1">· {count}</span>}
            </button>
          );
        })}
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

          {currentUserEmail && (
            <div className="flex gap-2 mt-3">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="3 words max..."
                onKeyDown={(e) => e.key === "Enter" && handleComment()}
                className="border-[3px] border-foreground"
              />
              <Button
                onClick={handleComment}
                disabled={wordCount === 0 || wordCount > 3}
                className="border-[3px] border-foreground shadow-brutal"
              >
                Post
              </Button>
            </div>
          )}
          {wordCount > 3 && (
            <p className="text-destructive text-xs font-bold mt-2">Max 3 words!</p>
          )}
        </div>
      )}
    </Card>
  );
}

