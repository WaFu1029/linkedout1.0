import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Quote, UtensilsCrossed, Palette, Heart, ArrowRight, ChevronDown } from "lucide-react";

interface Profile {
  id?: string;
  email?: string;
  full_name?: string | null;
  industry?: string | null;
  favorite_food?: string | null;
  favorite_color?: string | null;
  favorite_artist?: string | null;
  hobbies?: string[] | null;
  motivational_quote?: string | null;
}

interface Post {
  id: string;
  author: string;
  industry: string;
  author_email?: string;
}

interface MobileProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: Profile | null;
  post?: Post | null;
}

export function MobileProfileDrawer({ isOpen, onClose, profile, post }: MobileProfileDrawerProps) {
  if (!post) return null;

  const firstName = post.author?.split(" ")[0] || post.author || "User";
  const industry = profile?.industry || post.industry || "Human Being";

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity z-40 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-background border-t-[3px] border-foreground z-50 transition-transform duration-300 max-h-[80vh] overflow-y-auto ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Handle */}
        <div className="sticky top-0 bg-background py-3 flex justify-center border-b-[3px] border-foreground">
          <button onClick={onClose} className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Header */}
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

          {/* Hobbies */}
          {profile?.hobbies && profile.hobbies.length > 0 && (
            <div className="mb-6">
              <span className="font-bold text-sm uppercase tracking-wide block mb-3">🎯 Hobbies</span>
              <div className="flex flex-wrap gap-2">
                {profile.hobbies.map((hobby, i) => (
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

          {/* Favorites */}
          <div className="space-y-3 mb-6">
            {profile?.favorite_food && (
              <div className="flex items-center gap-3 bg-secondary p-3 border-[3px] border-foreground">
                <UtensilsCrossed className="w-4 h-4 text-primary" />
                <div>
                  <span className="font-bold text-xs text-muted-foreground uppercase tracking-wide block">Favorite Food</span>
                  <p className="font-semibold text-sm">{profile.favorite_food}</p>
                </div>
              </div>
            )}

            {profile?.favorite_color && (
              <div className="flex items-center gap-3 bg-secondary p-3 border-[3px] border-foreground">
                <Palette className="w-4 h-4 text-primary" />
                <div>
                  <span className="font-bold text-xs text-muted-foreground uppercase tracking-wide block">Favorite Color</span>
                  <p className="font-semibold text-sm">{profile.favorite_color}</p>
                </div>
              </div>
            )}

            {profile?.favorite_artist && (
              <div className="flex items-center gap-3 bg-secondary p-3 border-[3px] border-foreground">
                <Heart className="w-4 h-4 text-primary" />
                <div>
                  <span className="font-bold text-xs text-muted-foreground uppercase tracking-wide block">Favorite Artist</span>
                  <p className="font-semibold text-sm">{profile.favorite_artist}</p>
                </div>
              </div>
            )}
          </div>

          {/* View Full Profile */}
          {post.author_email && (
            <Link to={`/profile/${profile?.id || post.author_email}`}>
              <Button className="w-full border-[3px] border-foreground shadow-brutal">
                View Full Profile
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}






