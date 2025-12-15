import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FailurePost } from "@/components/FailurePost";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

// Mock data for demo
const mockPosts = [
  {
    id: "1",
    author: "Jamie Chen",
    industry: "Software Engineering",
    content: "Got rejected from my dream job at a FAANG company for the 4th time. They said I 'lacked leadership experience.' I've been leading a team of 8 for 2 years. Sometimes the answer is just no, and that's okay.",
    tags: ["rejection", "job search", "tech industry"],
    timestamp: "2h ago",
    reactions: { same: 47, itsOk: 23, youreDoingGreat: 89, youGotThis: 156 },
    comments: [{ text: "Been there too" }, { text: "Their loss honestly" }],
    size: "lg" as const,
  },
  {
    id: "2",
    author: "Marcus Williams",
    industry: "Freelance Design",
    content: "Lost a client because I was 'too honest' about timeline estimates. Apparently they wanted me to lie?",
    tags: ["freelancing", "client work"],
    timestamp: "5h ago",
    reactions: { same: 234, itsOk: 45, youreDoingGreat: 67, youGotThis: 89 },
    size: "sm" as const,
  },
  {
    id: "3",
    author: "Priya Sharma",
    industry: "Marketing",
    content: "Pitched a campaign I spent 3 weeks on. Client chose the competitor's idea which was literally just 'make it pop.' I need a drink.",
    tags: ["creative block", "client work", "rejection"],
    timestamp: "8h ago",
    reactions: { same: 189, itsOk: 78, youreDoingGreat: 234, youGotThis: 167 },
    size: "tall" as const,
  },
  {
    id: "4",
    author: "Alex Rivera",
    industry: "Startup Founder",
    content: "My startup failed after 3 years. We raised $2M, hired 15 people, and ultimately couldn't find product-market fit. I learned more from this failure than any success. Now I'm figuring out what's next.",
    tags: ["startup failure", "entrepreneurship", "lessons learned"],
    timestamp: "1d ago",
    reactions: { same: 89, itsOk: 156, youreDoingGreat: 423, youGotThis: 534 },
    comments: [{ text: "Respect for sharing" }],
    size: "wide" as const,
  },
  {
    id: "5",
    author: "Sam Torres",
    industry: "Healthcare",
    content: "Forgot to unmute on my first ever conference presentation. Spoke for 5 minutes to silence. 200 attendees.",
    tags: ["public speaking", "embarrassing"],
    timestamp: "2d ago",
    reactions: { same: 567, itsOk: 234, youreDoingGreat: 123, youGotThis: 89 },
    size: "sm" as const,
  },
  {
    id: "6",
    author: "Jordan Lee",
    industry: "Academia",
    content: "15th paper rejection this year. Reviewer said my methodology was 'fundamentally flawed' using the exact same approach that won an award last year. Peer review is chaos.",
    tags: ["academia", "rejection", "imposter syndrome"],
    timestamp: "3d ago",
    reactions: { same: 345, itsOk: 189, youreDoingGreat: 267, youGotThis: 198 },
    size: "md" as const,
  },
];

const allTags = [
  "rejection",
  "job search",
  "tech industry",
  "freelancing",
  "client work",
  "creative block",
  "startup failure",
  "entrepreneurship",
  "public speaking",
  "embarrassing",
  "academia",
  "imposter syndrome",
  "lessons learned",
];

const Feed = () => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredPosts = selectedTag
    ? mockPosts.filter((post) => post.tags.includes(selectedTag))
    : mockPosts;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Your Feed</h1>
              <p className="text-muted-foreground">
                Where vulnerability meets community
              </p>
            </div>
            <Button size="lg">
              <Plus className="mr-2" /> Share a Failure
            </Button>
          </div>

          {/* Tags filter */}
          <div className="mb-8 overflow-x-auto">
            <div className="flex gap-2 pb-2">
              <Button
                variant={selectedTag === null ? "default" : "tag"}
                size="tag"
                onClick={() => setSelectedTag(null)}
              >
                All
              </Button>
              {allTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "tag"}
                  size="tag"
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-auto">
            {filteredPosts.map((post) => (
              <FailurePost key={post.id} {...post} />
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground">
                No failures found with this tag. That's suspicious... 🤔
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Feed;
