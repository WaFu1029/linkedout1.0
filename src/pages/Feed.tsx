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

const motivationalQuotes = [
  // Original quotes
  { text: "Failure is simply the opportunity to begin again, this time more intelligently.", author: "Henry Ford" },
  // Churchill quote removed (disputed attribution)
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { text: "The only real mistake is the one from which we learn nothing.", author: "Henry Ford" },
  { text: "Failures are finger posts on the road to achievement.", author: "C.S. Lewis" },
  { text: "Every adversity carries with it the seed of an equal or greater benefit.", author: "Napoleon Hill" },
  { text: "It's fine to celebrate success, but it is more important to heed the lessons of failure.", author: "Bill Gates" },
  { text: "Only those who dare to fail greatly can ever achieve greatly.", author: "Robert F. Kennedy" },
  { text: "Failure is the condiment that gives success its flavor.", author: "Truman Capote" },
  { text: "The master has failed more times than the beginner has even tried.", author: "Stephen McCranie" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { text: "What would you attempt to do if you knew you could not fail?", author: "Robert Schuller" },
  
  // New quotes
  { text: "Ever tried. Ever failed. No matter. Try again. Fail again. Fail better.", author: "Samuel Beckett" },
  { text: "There is no innovation and creativity without failure. Period.", author: "Brené Brown" },
  { text: "Failure is not the opposite of success; it's part of success.", author: "Arianna Huffington" },
  { text: "I can accept failure, everyone fails at something. But I can't accept not trying.", author: "Michael Jordan" },
  { text: "It is impossible to live without failing at something, unless you live so cautiously that you might as well not have lived at all.", author: "J.K. Rowling" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
  { text: "Failure should be our teacher, not our undertaker.", author: "Denis Waitley" },
  { text: "You build on failure. You use it as a stepping stone.", author: "Johnny Cash" },
  { text: "Do not be embarrassed by your failures, learn from them and start again.", author: "Richard Branson" },
  { text: "Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.", author: "Thomas Edison" },
  { text: "Rock bottom became the solid foundation on which I rebuilt my life.", author: "J.K. Rowling" },
  { text: "When we give ourselves permission to fail, we, at the same time, give ourselves permission to excel.", author: "Eloise Ristad" },
  // Einstein quotes removed or could be kept only as "Attributed to Albert Einstein"
  { text: "Mistakes are the portals of discovery.", author: "James Joyce" },
  { text: "Winners are not afraid of losing. But losers are. Failure is part of the process of success.", author: "Robert Kiyosaki" },
  { text: "You may encounter many defeats, but you must not be defeated.", author: "Maya Angelou" },
  { text: "If you're not prepared to be wrong, you'll never come up with anything original.", author: "Ken Robinson" },
  { text: "Pain is temporary. Quitting lasts forever.", author: "Lance Armstrong" },
  { text: "It's not how far you fall, but how high you bounce that counts.", author: "Zig Ziglar" },
  { text: "Don't worry about failures, worry about the chances you miss when you don't even try.", author: "Jack Canfield" },
  // Churchill quote removed (disputed attribution)
  { text: "The phoenix must burn to emerge.", author: "Janet Fitch" },
  { text: "Failure is the tuition you pay for success.", author: "Walter Brunell" },
  { text: "Your best teacher is your last mistake.", author: "Ralph Nader" },
  { text: "No human ever became interesting by not failing.", author: "Carrie Fisher" },
  { text: "We are all failures — at least the best of us are.", author: "J.M. Barrie" },
  { text: "Defeat is not the worst of failures. Not to have tried is the true failure.", author: "George Edward Woodberry" },
];


const Feed = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [showQuote, setShowQuote] = useState(false);
  const [quoteFadingOut, setQuoteFadingOut] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(motivationalQuotes[0]);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [slideInDirection, setSlideInDirection] = useState<'left' | 'right' | null>(null);
  const [isSliding, setIsSliding] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Animation duration in ms (slower for smoother effect)
  const slideDuration = 700;

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
    if (currentIndex < visiblePosts.length - 1 && !isSliding && !showQuote) {
      setIsSliding(true);
      setShowProfileDrawer(false);
      setPreviousIndex(currentIndex);
      setSlideDirection('left');
      setPendingIndex(currentIndex + 1);
      // Pick a random quote
      setCurrentQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0 && !isSliding && !showQuote) {
      setIsSliding(true);
      setShowProfileDrawer(false);
      setPreviousIndex(currentIndex);
      setSlideDirection('right');
      setPendingIndex(currentIndex - 1);
      // Pick a random quote
      setCurrentQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
    }
  };

  // Handle the transition sequence: slide out -> show quote -> fade out quote -> slide in new card
  useEffect(() => {
    if (slideDirection && pendingIndex !== null && isSliding) {
      // Phase 1: Wait for slide-out animation to complete
      const slideOutTimer = setTimeout(() => {
        // Clear slide-out state and show quote
        const direction = slideDirection; // Save for slide-in
        setPreviousIndex(null);
        setSlideDirection(null);
        setShowQuote(true);
        setQuoteFadingOut(false);
        
        // Phase 2: Show quote for 1.5 seconds, then start fade out
        const quoteFadeTimer = setTimeout(() => {
          setQuoteFadingOut(true);
          
          // Phase 3: Wait for fade-out animation (500ms), then slide in new card
          const quoteHideTimer = setTimeout(() => {
            setCurrentIndex(pendingIndex);
            setShowQuote(false);
            setQuoteFadingOut(false);
            setSlideInDirection(direction);
            setPendingIndex(null);
            
            // Phase 4: After slide-in completes, reset all state
            const slideInTimer = setTimeout(() => {
              setSlideInDirection(null);
              setIsSliding(false);
            }, slideDuration);
            
          }, 500);
          
        }, 3000);
        
      }, slideDuration);
      
      return () => clearTimeout(slideOutTimer);
    }
  }, [slideDirection, pendingIndex, isSliding]);

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
      if (e.key === "ArrowRight" && !isSliding && !showQuote) goNext();
      if (e.key === "ArrowLeft" && !isSliding && !showQuote) goPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, visiblePosts.length, isSliding, showQuote]);

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
            disabled={currentIndex === 0 || isSliding || showQuote}
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
            {/* Motivational Quote Overlay */}
            {showQuote && (
              <div className={`absolute inset-0 flex items-center justify-center z-10 transition-opacity duration-500 ${quoteFadingOut ? 'opacity-0' : 'opacity-100 animate-in fade-in duration-300'}`}>
                <div className="max-w-2xl text-center px-8">
                  <div className="bg-primary/10 border-[3px] border-foreground shadow-brutal p-8 md:p-12">
                    <Sparkles className="w-8 h-8 mx-auto mb-4 text-primary" />
                    <p className="text-2xl md:text-3xl font-bold leading-relaxed mb-4">
                      "{currentQuote.text}"
                    </p>
                    <p className="text-lg font-semibold text-muted-foreground">
                      — {currentQuote.author}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Outgoing card (previous post sliding out) */}
            {previousIndex !== null && previousPost && slideDirection && (
              <div
                className="absolute inset-0 flex gap-6"
                ref={(el) => {
                  if (el && slideDirection) {
                    // Start at center
                    el.style.transition = 'none';
                    el.style.transform = 'translateX(0)';
                    // Force reflow
                    el.offsetHeight;
                    // Animate to off-screen with slower duration
                    el.style.transition = `transform ${slideDuration}ms ease-out`;
                    el.style.transform = slideDirection === 'left' ? 'translateX(-100%)' : 'translateX(100%)';
                  }
                }}
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
            {!showQuote && !slideDirection && (
              <div
                className={`h-full flex gap-6`}
                style={{ 
                  transform: 'translateX(0)',
                }}
                ref={(el) => {
                  if (el && slideInDirection) {
                    // Set initial off-screen position immediately
                    el.style.transition = 'none';
                    el.style.transform = slideInDirection === 'left' ? 'translateX(100%)' : 'translateX(-100%)';
                    // Force reflow
                    el.offsetHeight;
                    // Enable transition and animate to center with slower duration
                    el.style.transition = `transform ${slideDuration}ms ease-out`;
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
            )}
          </div>
        </div>

        {/* Right Arrow */}
        <div className="flex items-center pl-4">
          <button
            onClick={goNext}
            disabled={currentIndex === visiblePosts.length - 1 || isSliding || showQuote}
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
          {/* Motivational Quote Overlay - Mobile */}
          {showQuote && (
            <div className={`absolute inset-0 flex items-center justify-center z-10 transition-opacity duration-500 px-4 ${quoteFadingOut ? 'opacity-0' : 'opacity-100 animate-in fade-in duration-300'}`}>
              <div className="w-full max-w-md text-center">
                <div className="bg-primary/10 border-[3px] border-foreground shadow-brutal p-6">
                  <Sparkles className="w-6 h-6 mx-auto mb-3 text-primary" />
                  <p className="text-xl font-bold leading-relaxed mb-3">
                    "{currentQuote.text}"
                  </p>
                  <p className="text-sm font-semibold text-muted-foreground">
                    — {currentQuote.author}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Outgoing card (previous post sliding out) - Mobile */}
          {previousIndex !== null && previousPost && slideDirection && (
            <div
              className="absolute inset-0 pt-20 pb-16 px-4"
              ref={(el) => {
                if (el && slideDirection) {
                  el.style.transition = 'none';
                  el.style.transform = 'translateX(0)';
                  el.offsetHeight;
                  el.style.transition = `transform ${slideDuration}ms ease-out`;
                  el.style.transform = slideDirection === 'left' ? 'translateX(-100%)' : 'translateX(100%)';
                }
              }}
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
          {!showQuote && !slideDirection && (
            <div
              className={`h-full`}
              ref={(el) => {
                if (el && slideInDirection) {
                  el.style.transition = 'none';
                  el.style.transform = slideInDirection === 'left' ? 'translateX(100%)' : 'translateX(-100%)';
                  el.offsetHeight;
                  el.style.transition = `transform ${slideDuration}ms ease-out`;
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
          )}
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