import { useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WallPost } from "@/components/WallPost";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Wall = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Fetch all posts from Supabase
  const { data: allPosts = [], isLoading } = useQuery({
    queryKey: ["wall-posts"],
    queryFn: async () => {
      // @ts-ignore - posts table types will be available after migration
      const { data: postsData, error } = await (supabase as any)
        .from("posts")
        .select("id, content, tags")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching wall posts:", error);
        return [];
      }

      return postsData || [];
    },
  });

  // Extract all unique tags from posts
  const allWallTags = useMemo(() => {
    const tagSet = new Set<string>();
    allPosts.forEach((post) => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [allPosts]);

  // Filter posts based on search and tag selection
  const filteredPosts = useMemo(() => {
    return allPosts.filter((post) => {
      const matchesSearch = post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
      const matchesTag = selectedTag 
        ? post.tags?.includes(selectedTag) ?? false
        : true;
      return matchesSearch && matchesTag;
    });
  }, [allPosts, searchQuery, selectedTag]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">The Wall</h1>
            <p className="text-xl text-muted-foreground mb-6">
              Our very own permanent and anonymous archive of all failures ever shared.
            </p>
            
            {/* Stats */}
            <div className="inline-block bg-foreground text-background px-6 py-4 border-[3px] border-foreground mb-8">
              <p className="text-3xl font-bold font-mono">{isLoading ? "..." : allPosts.length}</p>
              <p className="text-sm uppercase tracking-wide">Failures.</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="max-w-3xl mx-auto mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Search failures..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12"
              />
            </div>

            {/* Tags filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedTag === null ? "default" : "tag"}
                size="tag"
                onClick={() => setSelectedTag(null)}
                className={selectedTag === null ? "!shadow-none" : ""}
              >
                All
              </Button>
              {allWallTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "tag"}
                  size="tag"
                  onClick={() => setSelectedTag(tag)}
                  className={selectedTag === tag ? "!shadow-none" : ""}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-16">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground font-semibold">Loading failures...</p>
            </div>
          )}

          {/* Wall Posts - Masonry-like grid */}
          {!isLoading && (
            <div className="max-w-4xl mx-auto">
              <div className="columns-1 md:columns-2 gap-4 space-y-4">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="break-inside-avoid">
                    <WallPost content={post.content || ""} tags={post.tags || []} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoading && filteredPosts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground">
                {allPosts.length === 0 
                  ? "No failures shared yet. Be the first to add one to The Wall."
                  : "No failures match your search. The universe is suspiciously quiet..."}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Spacer to extend background below content */}
      <div className="bg-background h-32"></div>

      <div className="bg-background border-0">
        <Footer />
      </div>
    </div>
  );
};

export default Wall;
