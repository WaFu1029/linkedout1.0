import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { 
  Loader2, 
  Heart, 
  Palette, 
  UtensilsCrossed, 
  Edit2, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Quote,
  Sparkles,
  ChevronDown,
  UserPlus,
  UserMinus
} from "lucide-react";
import { FailurePost } from "@/components/FailurePost";

const industries = [
  "Software Engineering",
  "Design",
  "Marketing",
  "Finance",
  "Healthcare",
  "Education",
  "Freelance/Consulting",
  "Startup Founder",
  "Academia",
  "Creative Arts",
  "Student",
  "Unemployed",
  "Career Transition",
  "Retail",
  "Hospitality",
  "Real Estate",
  "Legal",
  "Engineering (Non-Software)",
  "Sales",
  "Human Resources",
  "Operations",
  "Product Management",
  "Data Science",
  "Content Creation",
  "Social Media",
  "Photography",
  "Music",
  "Writing",
  "Entrepreneurship",
  "Non-Profit",
  "Government",
  "Construction",
  "Manufacturing",
  "Transportation",
  "Food Service",
  "Fitness/Wellness",
  "Therapy/Counseling",
  "Research",
  "Consulting",
  "Other",
];

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  industry: string | null;
  favorite_food: string | null;
  favorite_color: string | null;
  favorite_artist: string | null;
  hobbies: string[] | null;
  motivational_quote: string | null;
}

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    industry: "",
    favorite_food: "",
    favorite_color: "",
    favorite_artist: "",
    hobbies: [] as string[],
    motivational_quote: "",
  });
  const [newHobby, setNewHobby] = useState("");
  const [saving, setSaving] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const isOwnProfile = !id || id === user?.id || user?.id === profile?.id;
  const profileId = id || user?.id || profile?.id;

  // Fetch posts for this profile
  const { data: userPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["profile-posts", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .eq("author_id", profileId)
        .order("created_at", { ascending: false });

      if (postsError) {
        // If table doesn't exist yet, return empty array
        if (postsError.code === "PGRST205" || postsError.message?.includes("Could not find the table")) {
          return [];
        }
        console.error("Error fetching posts:", postsError);
        return [];
      }

      if (!postsData || postsData.length === 0) {
        return [];
      }

      // Fetch reactions for all posts
      const postIds = postsData.map((p) => p.id);
      const { data: reactionsData } = await supabase
        .from("reactions")
        .select("*")
        .in("post_id", postIds);

      // Group reactions by post
      const reactionsByPost: Record<string, { like: number; dislike: number }> = {};
      reactionsData?.forEach((reaction) => {
        if (!reactionsByPost[reaction.post_id]) {
          reactionsByPost[reaction.post_id] = { like: 0, dislike: 0 };
        }
        if (reaction.reaction_type === 'like') {
          reactionsByPost[reaction.post_id].like += 1;
        } else if (reaction.reaction_type === 'dislike') {
          reactionsByPost[reaction.post_id].dislike += 1;
        }
      });

      // Fetch comments for all posts
      const { data: commentsData } = await supabase
        .from("comments")
        .select("*")
        .in("post_id", postIds)
        .order("created_at", { ascending: false });

      // Group comments by post
      const commentsByPost: Record<string, any[]> = {};
      commentsData?.forEach((comment) => {
        if (!commentsByPost[comment.post_id]) {
          commentsByPost[comment.post_id] = [];
        }
        commentsByPost[comment.post_id].push({
          text: comment.content,
        });
      });

      // Transform posts to match FailurePost format
      return postsData.map((post) => ({
        id: post.id,
        author: profile?.full_name || profile?.email?.split("@")[0] || "User",
        industry: profile?.industry || "Human Being",
        title: post.title || null,
        content: post.content,
        tags: post.tags || [],
        timestamp: formatDistanceToNow(new Date(post.created_at), { addSuffix: true }),
        reactions: reactionsByPost[post.id] || { like: 0, dislike: 0 },
        comments: commentsByPost[post.id] || [],
        author_id: post.author_id,
      }));
    },
    enabled: !!profileId && !!profile,
  });

  // Check if current user is following this profile and get follower/following counts
  useEffect(() => {
    const checkFollowing = async () => {
      if (!user || !profileId || isOwnProfile) {
        setIsFollowing(false);
        return;
      }

      // @ts-ignore - followers table types will be available after migration
      const { data } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", profileId)
        .single();

      setIsFollowing(!!data);
    };

    const fetchFollowerCounts = async () => {
      if (!profileId) return;

      try {
        // Get follower count (people following this profile)
        // @ts-ignore - followers table types will be available after migration
        const { count: followers } = await supabase
          .from("followers")
          .select("*", { count: "exact", head: true })
          .eq("following_id", profileId);

        // Get following count (people this profile follows)
        // @ts-ignore - followers table types will be available after migration
        const { count: following } = await supabase
          .from("followers")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", profileId);

        setFollowerCount(followers || 0);
        setFollowingCount(following || 0);
      } catch (error) {
        console.error("Error fetching follower counts:", error);
      }
    };

    if (profileId && user && !isOwnProfile) {
      checkFollowing();
    }
    
    if (profileId) {
      fetchFollowerCounts();
    }
  }, [profileId, user, isOwnProfile]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profileId = id || user?.id;

        if (!profileId) {
          if (user) {
            navigate("/auth");
          } else {
            navigate("/auth");
          }
          setLoading(false);
          return;
        }

        // Check if this is the user's own profile (no id param means own profile)
        const isViewingOwnProfile = !id && user?.id === profileId;

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", profileId)
          .single();

        if (error) {
          // Handle table not found error
          if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
            console.error("Profiles table not found. Please run the migration SQL file.");
            toast.error("Database not set up. Please run the migration SQL in Supabase.");
            setLoading(false);
            return;
          }
          
          // If viewing own profile and it doesn't exist (PGRST116 = no rows returned), create it
          if (isViewingOwnProfile && (error.code === "PGRST116" || error.message?.includes("No rows"))) {
            // Profile doesn't exist, create it
            const { data: newProfile, error: insertError } = await supabase
              .from("profiles")
              .insert({
                id: user!.id,
                email: user!.email || "",
                full_name: user!.user_metadata?.full_name || user!.email?.split("@")[0] || "User",
                industry: user!.user_metadata?.industry || null,
              })
              .select()
              .single();

            if (insertError) {
              console.error("Error creating profile:", insertError);
              toast.error("Failed to create profile");
              setLoading(false);
              return;
            } else if (newProfile) {
              setProfile(newProfile);
            }
          } else {
            console.error("Error loading profile:", error);
            toast.error("Failed to load profile");
          }
        } else if (data) {
          setProfile(data);
        } else {
          // No data returned and no error - profile doesn't exist
          if (isViewingOwnProfile && user) {
            // Create profile for own profile view
            const { data: newProfile, error: insertError } = await supabase
              .from("profiles")
              .insert({
                id: user.id,
                email: user.email || "",
                full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
                industry: user.user_metadata?.industry || null,
              })
              .select()
              .single();

            if (insertError) {
              console.error("Error creating profile:", insertError);
              toast.error("Failed to create profile");
            } else if (newProfile) {
              setProfile(newProfile);
            }
          }
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (user || id) {
      loadProfile();
    } else {
      navigate("/auth");
    }
  }, [id, user, navigate]);

  const startEditing = () => {
    if (profile) {
      setEditData({
        industry: profile.industry || "",
        favorite_food: profile.favorite_food || "",
        favorite_color: profile.favorite_color || "",
        favorite_artist: profile.favorite_artist || "",
        hobbies: profile.hobbies || [],
        motivational_quote: profile.motivational_quote || "",
      });
      setEditing(true);
    }
  };

  const saveProfile = async () => {
    if (!profile || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update(editData)
        .eq("id", profile.id);

      if (error) {
        toast.error("Failed to update profile");
        console.error(error);
      } else {
        setProfile({ ...profile, ...editData });
        setEditing(false);
        toast.success("Profile updated!");
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const addHobby = () => {
    if (newHobby.trim()) {
      setEditData((prev) => ({
        ...prev,
        hobbies: [...(prev.hobbies || []), newHobby.trim()],
      }));
      setNewHobby("");
    }
  };

  const removeHobby = (index: number) => {
    setEditData((prev) => ({
      ...prev,
      hobbies: prev.hobbies.filter((_, i) => i !== index),
    }));
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error("Create an account to interact with other users", {
        action: {
          label: "Sign Up",
          onClick: () => navigate("/auth?mode=signup"),
        },
      });
      return;
    }
    
    if (!profileId || isOwnProfile || isFollowingLoading) return;

    setIsFollowingLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("followers")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", profileId);

        if (error) throw error;
        setIsFollowing(false);
        toast.success("Unfollowed");
      } else {
        // Follow
        const { error } = await supabase
          .from("followers")
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground font-semibold">Loading profile...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile && !loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <p className="font-bold text-xl mb-4">Profile not found</p>
            <p className="text-muted-foreground text-sm">
              If you just set up the database, make sure you've run the migration SQL file in your Supabase dashboard.
            </p>
            <p className="text-muted-foreground text-xs mt-2 font-mono">
              See: supabase/migrations/20240101000000_create_profiles_table.sql
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const firstName = profile.full_name?.split(" ")[0] || profile.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <Card className="border-[3px] border-foreground shadow-brutal p-6 md:p-8 mb-8">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">{firstName}</h1>
                  
                  {editing ? (
                    <div className="mt-3 max-w-xs relative">
                      <select
                        value={editData.industry}
                        onChange={(e) => setEditData({ ...editData, industry: e.target.value })}
                        className="flex h-11 w-full bg-cream-warm px-4 py-2 pr-12 text-base font-medium border-[3px] border-foreground transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 appearance-none"
                      >
                        <option value="">Select your industry</option>
                        {industries.map((ind) => (
                          <option key={ind} value={ind}>
                            {ind}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                    </div>
                  ) : (
                    <p className="text-lg text-primary font-semibold font-mono mt-2">
                      {profile.industry || "Human Being"}
                    </p>
                  )}

                  {/* Follower/Following Counts */}
                  <div className="flex gap-4 mt-4">
                    <button
                      className="hover:text-primary transition-colors"
                      onClick={() => {
                        // TODO: Could navigate to a followers/following list page
                      }}
                    >
                      <span className="font-bold text-lg">{followerCount}</span>
                      <span className="text-sm text-muted-foreground ml-1">Followers</span>
                    </button>
                    <button
                      className="hover:text-primary transition-colors"
                      onClick={() => {
                        // TODO: Could navigate to a followers/following list page
                      }}
                    >
                      <span className="font-bold text-lg">{followingCount}</span>
                      <span className="text-sm text-muted-foreground ml-1">Following</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <>
                      {editing ? (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => setEditing(false)}
                            className="border-[3px] border-foreground"
                          >
                            <X className="w-4 h-4 mr-1" /> Cancel
                          </Button>
                          <Button
                            onClick={saveProfile}
                            disabled={saving}
                            className="border-[3px] border-foreground"
                          >
                            {saving ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-1" />
                            ) : (
                              <Save className="w-4 h-4 mr-1" />
                            )}
                            Save
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={startEditing}
                          className="border-[3px] border-foreground"
                        >
                          <Edit2 className="w-4 h-4 mr-1" /> Edit Profile
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      onClick={handleFollow}
                      disabled={isFollowingLoading}
                      variant={isFollowing ? "outline" : "default"}
                      className={`border-[3px] border-foreground ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {isFollowingLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-1" /> Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-1" /> Follow
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Motivational Quote */}
              <div className="mt-6 pt-6 border-t-[3px] border-dashed border-foreground">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center border-[3px] border-foreground">
                    <Quote className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-sm uppercase tracking-wide">Favorite Quote</span>
                </div>
                
                {editing ? (
                  <textarea
                    value={editData.motivational_quote}
                    onChange={(e) => setEditData({ ...editData, motivational_quote: e.target.value })}
                    placeholder="What motivates you?"
                    className="flex min-h-[100px] w-full bg-cream-warm px-4 py-2 text-base font-medium border-[3px] border-foreground transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 resize-none"
                  />
                ) : profile.motivational_quote ? (
                  <div className="bg-secondary border-[3px] border-foreground p-4">
                    <p className="font-medium text-lg italic">
                      "{profile.motivational_quote}"
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No quote added yet</p>
                )}
              </div>

              {/* Hobbies */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center border-[3px] border-foreground">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-sm uppercase tracking-wide">Hobbies</span>
                </div>
                
                {editing ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {editData.hobbies?.map((hobby, i) => (
                        <span 
                          key={i}
                          className="bg-primary text-primary-foreground px-4 py-2 font-semibold border-[3px] border-foreground flex items-center gap-2"
                        >
                          {hobby}
                          <button 
                            onClick={() => removeHobby(i)} 
                            className="hover:text-destructive transition-colors"
                            type="button"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 max-w-xs">
                      <Input
                        value={newHobby}
                        onChange={(e) => setNewHobby(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHobby())}
                        placeholder="Add hobby..."
                        className="shadow-none"
                      />
                      <Button 
                        onClick={addHobby}
                        className="border-[3px] border-foreground shadow-none"
                        type="button"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.hobbies && profile.hobbies.length > 0 ? (
                      profile.hobbies.map((hobby, i) => (
                        <span 
                          key={i}
                          className="bg-primary text-primary-foreground px-4 py-2 font-semibold border-[3px] border-foreground"
                        >
                          {hobby}
                        </span>
                      ))
                    ) : (
                      <p className="text-muted-foreground italic">No hobbies listed</p>
                    )}
                  </div>
                )}
              </div>

              {/* Favorites */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="flex items-center gap-3 bg-secondary p-4 border-[3px] border-foreground">
                  <UtensilsCrossed className="w-5 h-5 text-primary" />
                  <div className="flex-grow">
                    <span className="font-bold text-xs text-muted-foreground uppercase tracking-wide block">Favorite Food</span>
                    {editing ? (
                      <Input
                        value={editData.favorite_food}
                        onChange={(e) => setEditData({ ...editData, favorite_food: e.target.value })}
                        className="mt-1 h-9 shadow-none"
                      />
                    ) : (
                      <p className="font-semibold mt-1">{profile.favorite_food || "—"}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-secondary p-4 border-[3px] border-foreground">
                  <Palette className="w-5 h-5 text-primary" />
                  <div className="flex-grow">
                    <span className="font-bold text-xs text-muted-foreground uppercase tracking-wide block">Favorite Color</span>
                    {editing ? (
                      <Input
                        value={editData.favorite_color}
                        onChange={(e) => setEditData({ ...editData, favorite_color: e.target.value })}
                        className="mt-1 h-9 shadow-none"
                      />
                    ) : (
                      <p className="font-semibold mt-1">{profile.favorite_color || "—"}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-secondary p-4 border-[3px] border-foreground">
                  <Heart className="w-5 h-5 text-primary" />
                  <div className="flex-grow">
                    <span className="font-bold text-xs text-muted-foreground uppercase tracking-wide block">Favorite Artist</span>
                    {editing ? (
                      <Input
                        value={editData.favorite_artist}
                        onChange={(e) => setEditData({ ...editData, favorite_artist: e.target.value })}
                        className="mt-1 h-9 shadow-none"
                      />
                    ) : (
                      <p className="font-semibold mt-1">{profile.favorite_artist || "—"}</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Posts Section */}
            <div className="mb-6">
              <h2 className="font-bold text-2xl mb-4">
                {isOwnProfile ? "My Failures" : `${firstName}'s Failures`}
              </h2>
              {postsLoading ? (
                <Card className="border-[3px] border-foreground shadow-brutal p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading failures...</p>
                </Card>
              ) : userPosts.length === 0 ? (
                <Card className="border-[3px] border-foreground shadow-brutal p-8 text-center">
                  <p className="text-muted-foreground">
                    {isOwnProfile 
                      ? "Your failures will appear here once you start sharing."
                      : "No failures shared yet."}
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userPosts.map((post) => (
                    <FailurePost
                      key={post.id}
                      id={post.id}
                      author={post.author}
                      industry={post.industry}
                      title={post.title}
                      content={post.content}
                      tags={post.tags}
                      timestamp={post.timestamp}
                      reactions={post.reactions}
                      comments={post.comments}
                      size="md"
                      author_id={post.author_id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
