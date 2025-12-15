import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, ChevronDown, ChevronUp } from "lucide-react";

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

  const reactions = post.reactions || {};
  const postComments = comments.filter((c) => c.id === post.id);
  const firstName = post.author?.split(" ")[0] || post.author;

  const handleReaction = (reactionKey: keyof Reaction) => {
    // TODO: Implement reaction logic with Supabase
    console.log("Reaction:", reactionKey);
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
      <p className="font-medium text-xl leading-relaxed mb-5 flex-grow">{post.content}</p>

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
          return (
            <button
              key={key}
              onClick={() => handleReaction(key)}
              disabled={!currentUserEmail}
              className="px-3 py-2 border-[3px] border-foreground font-semibold text-sm shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all bg-background hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
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

