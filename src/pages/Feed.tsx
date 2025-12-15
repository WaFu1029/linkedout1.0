import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { SwipePostCard } from "@/components/feed/SwipePostCard";
import { ProfileSidebar } from "@/components/feed/ProfileSidebar";
import { MobileProfileDrawer } from "@/components/feed/MobileProfileDrawer";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, ChevronRight, ChevronUp, Plus, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { subWeeks } from "date-fns";

// Mock data structure - will be replaced with Supabase queries
const mockPosts = [
  {
    id: "1",
    author: "Jamie Chen",
    industry: "Software Engineering",
    content: "Got rejected from my dream job at a FAANG company for the 4th time. They said I 'lacked leadership experience.' I've been leading a team of 8 for 2 years. Sometimes the answer is just no, and that's okay.",
    tags: ["rejection", "job search", "tech industry"],
    timestamp: "2h ago",
    reactions: { same: 47, itsOk: 23, youreDoingGreat: 89, youGotThis: 156 },
    author_email: "jamie@example.com",
  },
  {
    id: "2",
    author: "Marcus Williams",
    industry: "Freelance Design",
    content: "Lost a client because I was 'too honest' about timeline estimates. Apparently they wanted me to lie?",
    tags: ["freelancing", "client work"],
    timestamp: "5h ago",
    reactions: { same: 234, itsOk: 45, youreDoingGreat: 67, youGotThis: 89 },
    author_email: "marcus@example.com",
  },
  {
    id: "3",
    author: "Priya Sharma",
    industry: "Marketing",
    content: "Pitched a campaign I spent 3 weeks on. Client chose the competitor's idea which was literally just 'make it pop.' I need a drink.",
    tags: ["creative block", "client work", "rejection"],
    timestamp: "8h ago",
    reactions: { same: 189, itsOk: 78, youreDoingGreat: 234, youGotThis: 167 },
    author_email: "priya@example.com",
  },
  {
    id: "4",
    author: "Alex Rivera",
    industry: "Startup Founder",
    content: "My startup failed after 3 years. We raised $2M, hired 15 people, and ultimately couldn't find product-market fit. I learned more from this failure than any success. Now I'm figuring out what's next.",
    tags: ["startup failure", "entrepreneurship", "lessons learned"],
    timestamp: "1d ago",
    reactions: { same: 89, itsOk: 156, youreDoingGreat: 423, youGotThis: 534 },
    author_email: "alex@example.com",
  },
];

const Feed = () => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // TODO: Replace with actual Supabase queries when posts table exists
  const { data: allPosts = mockPosts, isLoading: postsLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      // Placeholder for future Supabase query
      return mockPosts;
    },
  });

  // Fetch profiles for each post author
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
  const currentPostProfile = profiles.find((p) => p.email === currentPost?.author_email);

  const goNext = () => {
    if (currentIndex < visiblePosts.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setSwipeDirection(1);
      setShowProfileDrawer(false);
      // Wait for slide-out animation to complete before changing index
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        // Start new cards from the right (100%), then slide to center
        setSwipeDirection(-1);
        // Use requestAnimationFrame to ensure the DOM updates before animating
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setSwipeDirection(0);
            setIsTransitioning(false);
          });
        });
      }, 500);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setSwipeDirection(-1);
      setShowProfileDrawer(false);
      // Wait for slide-out animation to complete before changing index
      setTimeout(() => {
        setCurrentIndex((prev) => prev - 1);
        // Start new cards from the left (-100%), then slide to center
        setSwipeDirection(1);
        // Use requestAnimationFrame to ensure the DOM updates before animating
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setSwipeDirection(0);
            setIsTransitioning(false);
          });
        });
      }, 500);
    }
  };

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
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, visiblePosts.length]);

  // Note: swipeDirection is now reset in goNext/goPrev after index change

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Desktop Layout */}
      <div className="hidden md:flex h-[calc(100vh-64px)] px-4 pt-24">
        {/* Left Arrow */}
        <div className="flex items-center pr-4">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="p-3 bg-background border-[3px] border-foreground shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-brutal"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 px-0">
            <h1 className="font-bold text-3xl tracking-tight">The Feed</h1>
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

          {/* Post and Profile Cards with transition - moving together */}
          <div className="flex-1 relative overflow-hidden">
            <div
              className="h-full flex gap-6 transition-transform duration-500 ease-in-out"
              style={{
                transform: swipeDirection === 1 
                  ? "translateX(-100%)" 
                  : swipeDirection === -1 
                  ? "translateX(100%)" 
                  : "translateX(0)",
              }}
            >
              {/* Post Section - 65% */}
              <div className="w-[65%] flex flex-col">
                {currentPost && (
                  <SwipePostCard post={currentPost} currentUserEmail={user?.email} comments={[]} />
                )}
              </div>

              {/* Profile Section - 35% */}
              <div className="w-[35%] flex flex-col">
                <ProfileSidebar profile={currentPostProfile || null} post={currentPost || null} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Arrow */}
        <div className="flex items-center pl-4">
          <button
            onClick={goNext}
            disabled={currentIndex === visiblePosts.length - 1}
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
          <h1 className="font-bold text-xl tracking-tight">The Feed</h1>
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

        {/* Post Card with Animation */}
        <div className="h-full pt-20 pb-16 px-4 overflow-hidden">
          <div
            className="h-full transition-transform duration-500 ease-in-out"
            style={{
              transform: swipeDirection === 1 
                ? "translateX(-100%)" 
                : swipeDirection === -1 
                ? "translateX(100%)" 
                : "translateX(0)",
            }}
          >
            {currentPost && (
              <SwipePostCard post={currentPost} currentUserEmail={user?.email} comments={[]} isMobile />
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

      <Footer />
    </div>
  );
};

export default Feed;
