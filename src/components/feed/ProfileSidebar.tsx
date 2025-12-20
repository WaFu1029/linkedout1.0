import { Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  if (!post) return null;

  const firstName = post.author?.split(" ")[0] || post.author || "User";
  const industry = profile?.industry || post.industry || "Human Being";
  const profileId = profile?.id;
  const isOwnProfile = user?.id === profileId;

  // Check connection status
  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (!user || !profileId || isOwnProfile) {
        setIsConnected(false);
        setIsPending(false);
        setIsCheckingConnection(false);
        return;
      }

      try {
        // Check if current user has connected to this profile
        const { data: userToProfile } = await supabase
          .from("connections")
          .select("id")
          .eq("user_id", user.id)
          .eq("connected_user_id", profileId)
          .single();

        // Check if this profile has connected back to current user
        const { data: profileToUser } = await supabase
          .from("connections")
          .select("id")
          .eq("user_id", profileId)
          .eq("connected_user_id", user.id)
          .single();

        // Mutual connection exists only if both directions exist
        setIsConnected(!!userToProfile && !!profileToUser);
        // Pending if user sent connection but profile hasn't connected back
        setIsPending(!!userToProfile && !profileToUser);
      } catch (error) {
        setIsConnected(false);
        setIsPending(false);
      } finally {
        setIsCheckingConnection(false);
      }
    };

    checkConnectionStatus();
  }, [profileId, user, isOwnProfile]);

  const handleConnect = async () => {
    if (!user) {
      toast.error("Create an account to interact with other users", {
        action: {
          label: "Sign Up",
          onClick: () => navigate("/auth?mode=signup"),
        },
      });
      return;
    }
    
    if (!profileId || isOwnProfile || isConnecting) return;

    setIsConnecting(true);
    try {
      if (isConnected || isPending) {
        // Disconnect - remove the connection from current user to profile
        const { error } = await supabase
          .from("connections")
          .delete()
          .eq("user_id", user.id)
          .eq("connected_user_id", profileId);

        if (error) throw error;
        setIsConnected(false);
        setIsPending(false);
        toast.success("Disconnected");
      } else {
        // Connect - create connection from current user to profile
        const { error } = await supabase
          .from("connections")
          .insert({
            user_id: user.id,
            connected_user_id: profileId,
          });

        if (error) throw error;
        
        // Check if mutual connection now exists
        const { data: reverseConnection } = await supabase
          .from("connections")
          .select("id")
          .eq("user_id", profileId)
          .eq("connected_user_id", user.id)
          .single();

        if (reverseConnection) {
          setIsConnected(true);
          setIsPending(false);
          toast.success("Connected!");
        } else {
          setIsPending(true);
          setIsConnected(false);
          toast.success("Connection request sent");
        }
      }
    } catch (error) {
      console.error("Error connecting/disconnecting:", error);
      toast.error("Failed to update connection status");
    } finally {
      setIsConnecting(false);
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

      {/* Connect Button and View Full Profile Link */}
      {post.author_email && (
        <div className="mt-auto space-y-2">
          {!isOwnProfile && profileId && (
            <Button
              onClick={handleConnect}
              disabled={isConnecting || isCheckingConnection}
              variant={isConnected ? "outline" : "default"}
              className={`w-full border-[3px] border-foreground shadow-brutal ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isConnected || isPending ? "Disconnecting..." : "Connecting..."}
                </>
              ) : isConnected ? (
                <>
                  <UserMinus className="w-4 h-4 mr-2" />
                  Disconnect
                </>
              ) : isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2" />
                  Pending
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Connect
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

