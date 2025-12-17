import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { SwipePostCard } from "@/components/feed/SwipePostCard";
import { ProfileSidebar } from "@/components/feed/ProfileSidebar";
import { MobileProfileDrawer } from "@/components/feed/MobileProfileDrawer";
import { CreatePostDialog } from "@/components/feed/CreatePostDialog";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, ChevronRight, ChevronUp, Plus, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { subWeeks, formatDistanceToNow } from "date-fns";

// Mock data structure - will be replaced with Supabase queries
const mockPosts = [
  {
    id: "1",
    author: "Jamie Chen",
    industry: "Software Engineering",
    title: "4th FAANG Rejection",
    content: "Got rejected from my dream job at a FAANG company for the 4th time. They said I 'lacked leadership experience.' I've been leading a team of 8 for 2 years. Sometimes the answer is just no, and that's okay.",
    tags: ["rejection", "job search", "tech industry"],
    timestamp: "2h ago",
    reactions: { like: 245, dislike: 12 },
    author_email: "jamie@example.com",
  },
  {
    id: "2",
    author: "Marcus Williams",
    industry: "Freelance Design",
    title: null,
    content: "Lost a client because I was 'too honest' about timeline estimates. Apparently they wanted me to lie?",
    tags: ["freelancing", "client work"],
    timestamp: "5h ago",
    reactions: { like: 435, dislike: 8 },
    author_email: "marcus@example.com",
  },
  {
    id: "3",
    author: "Priya Sharma",
    industry: "Marketing",
    title: "The 'Make It Pop' Campaign",
    content: "Pitched a campaign I spent 3 weeks on. Client chose the competitor's idea which was literally just 'make it pop.' I need a drink.",
    tags: ["creative block", "client work", "rejection"],
    timestamp: "8h ago",
    reactions: { like: 668, dislike: 15 },
    author_email: "priya@example.com",
  },
  {
    id: "4",
    author: "Alex Rivera",
    industry: "Startup Founder",
    title: "3 Years, $2M, No Product-Market Fit",
    content: "My startup failed after 3 years. We raised $2M, hired 15 people, and ultimately couldn't find product-market fit. I learned more from this failure than any success. Now I'm figuring out what's next.",
    tags: ["startup failure", "entrepreneurship", "lessons learned"],
    timestamp: "1d ago",
    reactions: { like: 1202, dislike: 23 },
    author_email: "alex@example.com",
  },
];

const Feed = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch posts from Supabase
  const { data: allPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("Error fetching posts:", postsError);
        // Fallback to mock data if table doesn't exist yet
        if (postsError.code === "PGRST205" || postsError.message?.includes("Could not find the table")) {
          return mockPosts;
        }
        return [];
      }

      if (!postsData || postsData.length === 0) {
        return mockPosts; // Fallback to mock data if no posts exist
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

      // Fetch profiles to get author info
      const { data: profilesData } = await supabase.from("profiles").select("*");
      const profiles = profilesData || [];

      // Transform posts to match expected format
      return postsData.map((post) => {
        const authorProfile = profiles.find((p) => p.id === post.author_id);
        return {
          id: post.id,
          author: authorProfile?.full_name || authorProfile?.email?.split("@")[0] || "Anonymous",
          industry: authorProfile?.industry || "Human Being",
          title: post.title || null,
          content: post.content,
          tags: post.tags || [],
          timestamp: formatDistanceToNow(new Date(post.created_at), { addSuffix: true }),
          reactions: reactionsByPost[post.id] || { like: 0, dislike: 0 },
          author_email: authorProfile?.email || post.author_id,
          author_id: post.author_id,
        };
      });
    },
    enabled: true,
  });

  // Fetch profiles for each post author (for profile sidebar)
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*");
      return data || [];
    },
  });

  const twoWeeksAgo = subWeeks(new Date(), 2);

  // Filter posts based on visibility rules
  const visiblePosts = allPosts.filter((post: any) => {
    // For now, show all posts. In the future, filter by date and following
    return true;
  });

  const currentPost = visiblePosts[currentIndex];
  const currentPostProfile = profiles.find((p) => p.id === currentPost?.author_id || p.email === currentPost?.author_email);
  
  // Get previous post data for animation
  const previousPost = previousIndex !== null ? visiblePosts[previousIndex] : null;
  const previousPostProfile = previousPost ? profiles.find((p) => p.id === previousPost?.author_id || p.email === previousPost?.author_email) : null;

  const goNext = () => {
    if (currentIndex < visiblePosts.length - 1 && !slideDirection) {
      setShowProfileDrawer(false);
      setPreviousIndex(currentIndex);
      setSlideDirection('left');
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0 && !slideDirection) {
      setShowProfileDrawer(false);
      setPreviousIndex(currentIndex);
      setSlideDirection('right');
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Clear animation state after transition completes
  useEffect(() => {
    if (slideDirection) {
      const timer = setTimeout(() => {
        setPreviousIndex(null);
        setSlideDirection(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [slideDirection, currentIndex]);

  // Touch handlers for mobile swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe) {
      if (distanceX > minSwipeDistance) goNext();
      if (distanceX < -minSwipeDistance) goPrev();
    } else {
      if (distanceY > minSwipeDistance && !showProfileDrawer) {
        setShowProfileDrawer(true);
      }
      if (distanceY < -minSwipeDistance && showProfileDrawer) {
        setShowProfileDrawer(false);
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && !slideDirection) goNext();
      if (e.key === "ArrowLeft" && !slideDirection) goPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, visiblePosts.length, slideDirection]);

  if (postsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground font-semibold">Loading failures...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (visiblePosts.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <Sparkles className="w-16 h-16 mx-auto text-primary mb-4" />
            <p className="font-bold text-2xl mb-2">No failures yet!</p>
            <p className="text-lg text-muted-foreground mb-6">Be the first to share yours.</p>
            {user && (
              <Button size="lg" className="border-[3px] border-foreground shadow-brutal" onClick={() => setShowCreate(true)}>
                <Plus className="mr-2" />
                Share Failure
              </Button>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Helper function to get transform style for cards
  const getCardTransform = (isOutgoing: boolean) => {
    if (!slideDirection) return 'translateX(0)';
    
    if (isOutgoing) {
      // Outgoing card slides out
      return slideDirection === 'left' ? 'translateX(-100%)' : 'translateX(100%)';
    } else {
      // Incoming card slides in from opposite direction
      return 'translateX(0)';
    }
  };

  const getInitialTransform = () => {
    if (!slideDirection) return 'translateX(0)';
    // Incoming card starts off-screen
    return slideDirection === 'left' ? 'translateX(100%)' : 'translateX(-100%)';
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Desktop Layout */}
      <div className="hidden md:flex h-[calc(100vh-64px)] px-4 pt-24">
        {/* Left Arrow */}
        <div className="flex items-center pr-4">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0 || !!slideDirection}
            className="p-3 bg-background border-[3px] border-foreground shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-brutal"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 px-0">
            <h1 className="font-bold text-3xl tracking-tight">Your Feed</h1>
            {user && (
              <Button
                onClick={() => setShowCreate(true)}
                className="border-[3px] border-foreground shadow-brutal"
              >
                <Plus className="mr-2" />
                Share
              </Button>
            )}
          </div>

          {/* Post and Profile Cards with transition */}
          <div className="flex-1 relative overflow-hidden">
            {/* Outgoing card (previous post sliding out) */}
            {previousIndex !== null && previousPost && (
              <div
                className="absolute inset-0 flex gap-6 transition-transform duration-500 ease-out"
                style={{ transform: getCardTransform(true) }}
              >
                {/* Post Section - 65% */}
                <div className="w-[65%] flex flex-col">
                  <SwipePostCard 
                    post={previousPost} 
                    currentUserEmail={user?.email} 
                    comments={[]} 
                  />
                </div>

                {/* Profile Section - 35% */}
                <div className="w-[35%] flex flex-col">
                  <ProfileSidebar 
                    profile={previousPostProfile || null} 
                    post={previousPost || null} 
                  />
                </div>
              </div>
            )}

            {/* Incoming card (current post sliding in) */}
            <div
              className={`h-full flex gap-6 transition-transform duration-500 ease-out`}
              style={{ 
                transform: slideDirection ? 'translateX(0)' : 'translateX(0)',
                // Use CSS custom property for initial position
              }}
              ref={(el) => {
                if (el && slideDirection && previousIndex !== null) {
                  // Set initial off-screen position immediately
                  el.style.transition = 'none';
                  el.style.transform = getInitialTransform();
                  // Force reflow
                  el.offsetHeight;
                  // Enable transition and animate to center
                  el.style.transition = 'transform 500ms ease-out';
                  el.style.transform = 'translateX(0)';
                }
              }}
            >
              {/* Post Section - 65% */}
              <div className="w-[65%] flex flex-col">
                {currentPost && (
                  <SwipePostCard 
                    post={currentPost} 
                    currentUserEmail={user?.email} 
                    comments={[]} 
                  />
                )}
              </div>

              {/* Profile Section - 35% */}
              <div className="w-[35%] flex flex-col">
                <ProfileSidebar 
                  profile={currentPostProfile || null} 
                  post={currentPost || null} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Arrow */}
        <div className="flex items-center pl-4">
          <button
            onClick={goNext}
            disabled={currentIndex === visiblePosts.length - 1 || !!slideDirection}
            className="p-3 bg-background border-[3px] border-foreground shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-brutal"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Layout */}
      <div
        ref={containerRef}
        className="md:hidden h-[calc(100vh-64px)] relative overflow-hidden pt-16"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-background via-background/95 to-transparent pt-16">
          <h1 className="font-bold text-xl tracking-tight">Your Feed</h1>
          {user && (
            <Button
              onClick={() => setShowCreate(true)}
              size="sm"
              className="border-[3px] border-foreground shadow-brutal"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Post Cards with Animation */}
        <div className="h-full pt-20 pb-16 px-4 overflow-hidden relative">
          {/* Outgoing card (previous post sliding out) - Mobile */}
          {previousIndex !== null && previousPost && (
            <div
              className="absolute inset-0 pt-20 pb-16 px-4 transition-transform duration-500 ease-out"
              style={{ transform: getCardTransform(true) }}
            >
              <SwipePostCard 
                post={previousPost} 
                currentUserEmail={user?.email} 
                comments={[]} 
                isMobile 
              />
            </div>
          )}

          {/* Incoming card (current post sliding in) - Mobile */}
          <div
            className="h-full transition-transform duration-500 ease-out"
            ref={(el) => {
              if (el && slideDirection && previousIndex !== null) {
                el.style.transition = 'none';
                el.style.transform = getInitialTransform();
                el.offsetHeight;
                el.style.transition = 'transform 500ms ease-out';
                el.style.transform = 'translateX(0)';
              }
            }}
          >
            {currentPost && (
              <SwipePostCard 
                post={currentPost} 
                currentUserEmail={user?.email} 
                comments={[]} 
                isMobile 
              />
            )}
          </div>
        </div>

        {/* Swipe up hint */}
        {!showProfileDrawer && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
            <button
              onClick={() => setShowProfileDrawer(true)}
              className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors animate-bounce"
            >
              <ChevronUp className="w-5 h-5" />
              <span className="text-xs font-semibold">View Profile</span>
            </button>
          </div>
        )}

        {/* Mobile Profile Drawer */}
        <MobileProfileDrawer
          isOpen={showProfileDrawer}
          onClose={() => setShowProfileDrawer(false)}
          profile={currentPostProfile || null}
          post={currentPost || null}
        />
      </div>

      {/* Spacer to extend background below fixed-height content */}
      <div className="hidden md:block bg-background h-32"></div>

      <div className="bg-background border-0">
        <Footer />
      </div>

      {/* Create Post Dialog */}
      {user && (
        <CreatePostDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          userId={user.id}
        />
      )}
    </div>
  );
};

export default Feed;