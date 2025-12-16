import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

interface FailurePostProps {
  id: string;
  author: string;
  industry: string;
  content: string;
  tags: string[];
  timestamp: string;
  reactions: {
    same: number;
    itsOk: number;
    youreDoingGreat: number;
    youGotThis: number;
  };
  comments?: { text: string }[];
  size?: "sm" | "md" | "lg" | "tall" | "wide";
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
  content,
  tags,
  timestamp,
  reactions,
  comments = [],
  size = "sm",
}: FailurePostProps) {
  const [isReacting, setIsReacting] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleReaction = async (reactionType: "same" | "itsOk" | "youreDoingGreat" | "youGotThis") => {
    if (!user || !id || isReacting) return;

    setIsReacting(true);
    try {
      // Check if user already has this reaction
      const { data: existingReaction } = await supabase
        .from("reactions")
        .select("id")
        .eq("post_id", id)
        .eq("user_id", user.id)
        .eq("reaction_type", reactionType)
        .single();

      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from("reactions")
          .delete()
          .eq("post_id", id)
          .eq("user_id", user.id)
          .eq("reaction_type", reactionType);

        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from("reactions")
          .insert({
            post_id: id,
            user_id: user.id,
            reaction_type: reactionType,
          });

        if (error) throw error;
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

  return (
    <Card
      className={`${sizeClasses[size]} p-5 flex flex-col hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] cursor-pointer`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg">{author}</h3>
          <p className="text-sm text-muted-foreground font-mono">{industry}</p>
        </div>
        <span className="text-xs text-muted-foreground font-mono">{timestamp}</span>
      </div>

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
          onClick={() => handleReaction("same")}
          disabled={!user || isReacting}
        >
          Same · {reactions.same}
        </Button>
        <Button 
          variant="reaction" 
          size="reaction"
          onClick={() => handleReaction("itsOk")}
          disabled={!user || isReacting}
        >
          It's ok · {reactions.itsOk}
        </Button>
        <Button 
          variant="reaction" 
          size="reaction"
          onClick={() => handleReaction("youreDoingGreat")}
          disabled={!user || isReacting}
        >
          You're doing great! · {reactions.youreDoingGreat}
        </Button>
        <Button 
          variant="reaction" 
          size="reaction"
          onClick={() => handleReaction("youGotThis")}
          disabled={!user || isReacting}
        >
          You got this! · {reactions.youGotThis}
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
    </Card>
  );
}
