import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FailurePost } from "@/components/FailurePost";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Plus, UserPlus } from "lucide-react";

// Mock user data
const mockUser = {
  name: "Jamie Chen",
  industry: "Software Engineering",
  hobbies: "Rock climbing, Board games, Photography",
  favoriteFood: "Ramen (specifically tonkotsu)",
  favoriteColor: "Forest green",
  favoriteArtist: "Bon Iver",
  favoriteSong: {
    name: "Holocene",
    artist: "Bon Iver",
    album: "Bon Iver, Bon Iver",
    releaseDate: "2011",
  },
};

const mockUserPosts = [
  {
    id: "u1",
    author: "Jamie Chen",
    industry: "Software Engineering",
    content: "Got rejected from my dream job at a FAANG company for the 4th time. They said I 'lacked leadership experience.' I've been leading a team of 8 for 2 years.",
    tags: ["rejection", "job search", "tech industry"],
    timestamp: "2h ago",
    reactions: { same: 47, itsOk: 23, youreDoingGreat: 89, youGotThis: 156 },
    size: "md" as const,
  },
  {
    id: "u2",
    author: "Jamie Chen",
    industry: "Software Engineering",
    content: "Deployed to production on a Friday. You know how this story ends. 3 hours of downtime and a lot of apologies.",
    tags: ["coding", "embarrassing"],
    timestamp: "1w ago",
    reactions: { same: 234, itsOk: 89, youreDoingGreat: 45, youGotThis: 67 },
    size: "sm" as const,
  },
  {
    id: "u3",
    author: "Jamie Chen",
    industry: "Software Engineering",
    content: "Spent 2 weeks on a feature that got cut in the next planning meeting. At least I learned a lot about WebSockets?",
    tags: ["career", "lessons learned"],
    timestamp: "2w ago",
    reactions: { same: 156, itsOk: 67, youreDoingGreat: 123, youGotThis: 89 },
    size: "sm" as const,
  },
];

const Profile = () => {
  const [songSearch, setSongSearch] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <Card className="p-8 mb-8">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">{mockUser.name}</h1>
                  <p className="text-lg text-muted-foreground font-mono">{mockUser.industry}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <UserPlus className="mr-2 h-4 w-4" /> Follow
                  </Button>
                  <Button size="sm" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? "Save Profile" : "Edit Profile"}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Profile Details Grid */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {/* Favorite Song - Last.fm Integration */}
              <Card className="p-6">
                <h3 className="font-bold uppercase tracking-wide text-sm mb-4">Favorite Song</h3>
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input
                        placeholder="Search Last.fm..."
                        value={songSearch}
                        onChange={(e) => setSongSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Search and select from Last.fm</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-bold text-lg">{mockUser.favoriteSong.name}</p>
                    <p className="text-muted-foreground">{mockUser.favoriteSong.artist}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {mockUser.favoriteSong.album} · {mockUser.favoriteSong.releaseDate}
                    </p>
                  </div>
                )}
              </Card>

              {/* Hobbies */}
              <Card className="p-6">
                <h3 className="font-bold uppercase tracking-wide text-sm mb-4">Hobbies</h3>
                {isEditing ? (
                  <Input defaultValue={mockUser.hobbies} placeholder="What do you do for fun?" />
                ) : (
                  <p className="text-muted-foreground">{mockUser.hobbies}</p>
                )}
              </Card>

              {/* Favorite Food */}
              <Card className="p-6">
                <h3 className="font-bold uppercase tracking-wide text-sm mb-4">Favorite Food</h3>
                {isEditing ? (
                  <Input defaultValue={mockUser.favoriteFood} placeholder="What's your comfort food?" />
                ) : (
                  <p className="text-muted-foreground">{mockUser.favoriteFood}</p>
                )}
              </Card>

              {/* Favorite Color */}
              <Card className="p-6">
                <h3 className="font-bold uppercase tracking-wide text-sm mb-4">Favorite Color</h3>
                {isEditing ? (
                  <Input defaultValue={mockUser.favoriteColor} placeholder="What color speaks to you?" />
                ) : (
                  <p className="text-muted-foreground">{mockUser.favoriteColor}</p>
                )}
              </Card>
            </div>

            {/* Posts Section */}
            <Tabs defaultValue="public" className="w-full">
              <TabsList className="w-full border-[3px] border-foreground p-0 h-auto bg-background">
                <TabsTrigger 
                  value="public" 
                  className="flex-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold uppercase tracking-wide"
                >
                  Public Posts
                </TabsTrigger>
                <TabsTrigger 
                  value="archive" 
                  className="flex-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold uppercase tracking-wide"
                >
                  Your Archive
                </TabsTrigger>
              </TabsList>
              <TabsContent value="public" className="mt-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {mockUserPosts.map((post) => (
                    <FailurePost key={post.id} {...post} size="sm" />
                  ))}
                </div>
                <p className="text-center text-muted-foreground text-sm mt-6">
                  Posts are visible for 2 weeks, then move to your private archive.
                </p>
              </TabsContent>
              <TabsContent value="archive" className="mt-6">
                <div className="text-center py-12 bg-secondary/50 border-[3px] border-dashed border-foreground">
                  <p className="text-muted-foreground mb-4">
                    Your complete failure archive lives here.
                    <br />
                    Only you can see posts older than 2 weeks.
                  </p>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" /> Add a New Failure
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
