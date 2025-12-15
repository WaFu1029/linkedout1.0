import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WallPost } from "@/components/WallPost";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

// Mock data for The Wall - anonymous failures
const mockWallPosts = [
  {
    id: "w1",
    content: "Spent 6 months learning to code. Built my first app. It crashed on demo day in front of 50 investors. Twice.",
    tags: ["coding", "startup failure", "public speaking"],
  },
  {
    id: "w2",
    content: "Applied to 347 jobs over 8 months. Got 12 interviews. 0 offers. Then I got one. Persistence is weird.",
    tags: ["job search", "rejection", "persistence"],
  },
  {
    id: "w3",
    content: "Told my manager I deserved a promotion. They agreed. Then they laid me off the next month. Budget cuts.",
    tags: ["career", "layoffs", "irony"],
  },
  {
    id: "w4",
    content: "Wrote a book. Took 4 years. 23 publishers rejected it. Self-published. Sold 14 copies. 12 were my mom.",
    tags: ["creative failure", "rejection", "writing"],
  },
  {
    id: "w5",
    content: "Started a podcast about productivity. Missed every single publishing deadline I set for myself.",
    tags: ["irony", "productivity", "creative failure"],
  },
  {
    id: "w6",
    content: "Got the job. Hated the job. Quit the job. Now I'm back at square one but at least I know what I don't want.",
    tags: ["career", "self-discovery", "job search"],
  },
  {
    id: "w7",
    content: "Pitched my heart out. Client said 'we'll think about it.' That was 2019. Still thinking I guess.",
    tags: ["client work", "rejection", "freelancing"],
  },
  {
    id: "w8",
    content: "Learned a new skill every month for a year. Master of none, but at least I know I like learning more than doing.",
    tags: ["self-discovery", "learning", "imposter syndrome"],
  },
  {
    id: "w9",
    content: "Sent a strongly worded email to the wrong person. That person was my CEO. We had a 'chat' about communication.",
    tags: ["embarrassing", "career", "communication"],
  },
  {
    id: "w10",
    content: "Bootstrapped for 5 years. Finally took VC money. Regretted it in 5 months. Money isn't everything.",
    tags: ["startup failure", "entrepreneurship", "lessons learned"],
  },
];

const allWallTags = [
  "rejection",
  "job search",
  "startup failure",
  "career",
  "embarrassing",
  "creative failure",
  "imposter syndrome",
  "lessons learned",
  "self-discovery",
  "freelancing",
];

const Wall = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredPosts = mockWallPosts.filter((post) => {
    const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag ? post.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">The Wall</h1>
            <p className="text-xl text-muted-foreground">
              An anonymous, permanent archive of all failures ever shared.
            </p>
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

          {/* Wall Posts - Masonry-like grid */}
          <div className="max-w-4xl mx-auto">
            <div className="columns-1 md:columns-2 gap-4 space-y-4">
              {filteredPosts.map((post) => (
                <div key={post.id} className="break-inside-avoid">
                  <WallPost content={post.content} tags={post.tags} />
                </div>
              ))}
            </div>
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground">
                No failures match your search. The universe is suspiciously quiet...
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="max-w-3xl mx-auto mt-16 text-center">
            <div className="inline-block bg-foreground text-background px-6 py-4 border-[3px] border-foreground">
              <p className="text-3xl font-bold font-mono">{mockWallPosts.length}</p>
              <p className="text-sm uppercase tracking-wide">Failures archived forever</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Wall;
