import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Quote, ArrowRight, Heart, UserPlus, UserMinus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Profile {
  id?: string;
  email?: string;
  full_name?: string | null;
  industry?: string | null;
  hobbies?: string[] | null;
  motivational_quote?: string | null;
}

interface Post {
  id: string;
  author: string;
  industry: string;
  author_email?: string;
}

interface ProfileSidebarProps {
  profile?: Profile | null;
  post?: Post | null;
}

export function ProfileSidebar({ profile, post }: ProfileSidebarProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [isCheckingFollow, setIsCheckingFollow] = useState(true);

  if (!post) return null;

  const firstName = post.author?.split(" ")[0] || post.author || "User";
  const industry = profile?.industry || post.industry || "Human Being";
  const profileId = profile?.id;
  const isOwnProfile = user?.id === profileId;

  // Check if current user is following this profile
  useEffect(() => {
    const checkFollowing = async () => {
      if (!user || !profileId || isOwnProfile) {
        setIsFollowing(false);
        setIsCheckingFollow(false);
        return;
      }

      try {
        // @ts-ignore - followers table types will be available after migration
        const { data } = await supabase.from("followers")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", profileId)
          .single();

        setIsFollowing(!!data);
      } catch (error) {
        setIsFollowing(false);
      } finally {
        setIsCheckingFollow(false);
      }
    };

    checkFollowing();
  }, [profileId, user, isOwnProfile]);

  const handleFollow = async () => {
    if (!user || !profileId || isOwnProfile || isFollowingLoading) return;

    setIsFollowingLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        // @ts-ignore - followers table types will be available after migration
        const { error } = await supabase.from("followers")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", profileId);

        if (error) throw error;
        setIsFollowing(false);
        toast.success("Unfollowed");
      } else {
        // Follow
        // @ts-ignore - followers table types will be available after migration
        const { error } = await (supabase as any).from("followers")
          .insert({
            follower_id: user.id,
            following_id: profileId,
          });

        if (error) throw error;
        setIsFollowing(true);
        toast.success("Following");
      }
    } catch (error) {
      console.error("Error following/unfollowing:", error);
      toast.error("Failed to update follow status");
    } finally {
      setIsFollowingLoading(false);
    }
  };

  return (
    <Card className="h-full p-6 flex flex-col">
      {/* Name and Industry */}
      <div className="mb-6">
        <h2 className="font-bold text-2xl mb-2">{firstName}</h2>
        <p className="text-lg font-semibold text-primary font-mono">{industry}</p>
      </div>

      {/* Motivational Quote */}
      {profile?.motivational_quote && (
        <div className="mb-6 bg-secondary border-[3px] border-foreground p-4">
          <div className="flex items-center gap-2 mb-2">
            <Quote className="w-4 h-4 text-primary" />
            <span className="font-bold text-xs text-muted-foreground uppercase tracking-wide">Favorite Quote</span>
          </div>
          <p className="text-sm font-medium italic">"{profile.motivational_quote}"</p>
        </div>
      )}

      {/* Hobbies - max 2 */}
      {profile?.hobbies && profile.hobbies.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm uppercase tracking-wide text-muted-foreground">Hobbies</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.hobbies.slice(0, 2).map((hobby, i) => (
              <span
                key={i}
                className="bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold border-[3px] border-foreground shadow-brutal"
              >
                {hobby}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Follow Button and View Full Profile Link */}
      {post.author_email && (
        <div className="mt-auto space-y-2">
          {user && !isOwnProfile && profileId && (
            <Button
              onClick={handleFollow}
              disabled={isFollowingLoading || isCheckingFollow}
              variant={isFollowing ? "outline" : "default"}
              className="w-full border-[3px] border-foreground shadow-brutal"
            >
              {isFollowingLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isFollowing ? "Unfollowing..." : "Following..."}
                </>
              ) : isFollowing ? (
                <>
                  <UserMinus className="w-4 h-4 mr-2" />
                  Unfollow
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Follow
                </>
              )}
            </Button>
          )}
          <Link to={`/profile/${profile?.id || post.author_email}`}>
            <Button
              variant="outline"
              className="w-full border-[3px] border-foreground shadow-brutal"
            >
              View Full Profile
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}

