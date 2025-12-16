import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-0">
  <span className="text-2xl font-bold pr-1">Linked</span>
  <span className="text-2xl font-bold text-primary bg-foreground pl-1 pr-1.5 py-0.5">Out</span>
</Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/feed" className="font-semibold hover:text-primary transition-colors">
              Feed
            </Link>
            <Link to="/wall" className="font-semibold hover:text-primary transition-colors">
              The Wall
            </Link>
            <ThemeToggle />
            {user ? (
              <>
                <Link to="/profile" className="font-semibold hover:text-primary transition-colors">
                  Profile
                </Link>
                <Button variant="outline" size="sm" onClick={async () => {
                  await signOut();
                  navigate("/");
                }}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
                  Sign In
                </Button>
                <Button size="sm" onClick={() => navigate("/auth?mode=signup")}>
                  Join Us
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 border-[2px] border-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile nav */}
        {isOpen && (
          <div className="md:hidden border-t-[2px] border-foreground py-4 space-y-3">
            <Link
              to="/feed"
              className="block font-semibold hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Feed
            </Link>
            <Link
              to="/wall"
              className="block font-semibold hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              The Wall
            </Link>
            <div className="pt-2">
              <ThemeToggle />
            </div>
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="block font-semibold hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={async () => { 
                    await signOut(); 
                    setIsOpen(false);
                    navigate("/");
                  }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => { navigate("/auth"); setIsOpen(false); }}>
                  Sign In
                </Button>
                <Button size="sm" onClick={() => { navigate("/auth?mode=signup"); setIsOpen(false); }}>
                  Join Us
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
