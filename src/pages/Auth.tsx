import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
  "Other",
];

const Auth = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isSignup = searchParams.get("mode") === "signup";
  const [mode, setMode] = useState<"signin" | "signup">(isSignup ? "signup" : "signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");

  // Sync mode state with URL query params when they change
  useEffect(() => {
    setMode(isSignup ? "signup" : "signin");
  }, [isSignup]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "signup") {
      if (!name.trim() || !industry || !email.trim() || !password.trim()) {
        toast.error("Please fill in all fields");
        return;
      }
      toast.success("Welcome to LinkedOut! Ready to embrace your failures.");
      navigate("/feed");
    } else {
      if (!email.trim() || !password.trim()) {
        toast.error("Please enter your email and password");
        return;
      }
      toast.success("Welcome back! Your failures missed you.");
      navigate("/feed");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card className="p-2">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  {mode === "signin" ? "Welcome Back" : "Join the Community"}
                </CardTitle>
                <CardDescription>
                  {mode === "signin"
                    ? "Your failures missed you"
                    : "Start sharing your beautiful imperfections"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === "signup" && (
                    <>
                      <div>
                        <label className="block text-sm font-bold mb-2 uppercase tracking-wide">
                          Your Name
                        </label>
                        <Input
                          type="text"
                          placeholder="What should we call you?"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2 uppercase tracking-wide">
                          Industry
                        </label>
                        <select
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          className="flex h-11 w-full bg-cream-warm px-4 py-2 text-base font-medium border-[3px] border-foreground shadow-brutal transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        >
                          <option value="">Select your industry</option>
                          {industries.map((ind) => (
                            <option key={ind} value={ind}>
                              {ind}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-bold mb-2 uppercase tracking-wide">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 uppercase tracking-wide">
                      Password
                    </label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" size="lg">
                    {mode === "signin" ? "Sign In" : "Create Account"}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      const newMode = mode === "signin" ? "signup" : "signin";
                      setMode(newMode);
                      // Update URL to match the mode
                      if (newMode === "signup") {
                        setSearchParams({ mode: "signup" });
                      } else {
                        setSearchParams({});
                      }
                    }}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {mode === "signin"
                      ? "Don't have an account? Sign up"
                      : "Already have an account? Sign in"}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Fun tagline */}
            <p className="text-center mt-8 text-muted-foreground font-mono text-sm">
              "The first step to growth is admitting you're a mess."
              <br />
              — Everyone on LinkedOut
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;
