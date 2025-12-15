import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

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
  "Student",
  "Unemployed",
  "Career Transition",
  "Retail",
  "Hospitality",
  "Real Estate",
  "Legal",
  "Engineering (Non-Software)",
  "Sales",
  "Human Resources",
  "Operations",
  "Product Management",
  "Data Science",
  "Content Creation",
  "Social Media",
  "Photography",
  "Music",
  "Writing",
  "Entrepreneurship",
  "Non-Profit",
  "Government",
  "Construction",
  "Manufacturing",
  "Transportation",
  "Food Service",
  "Fitness/Wellness",
  "Therapy/Counseling",
  "Research",
  "Consulting",
  "Other",
];

const Auth = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSignup = searchParams.get("mode") === "signup";
  const [mode, setMode] = useState<"signin" | "signup">(isSignup ? "signup" : "signin");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/profile");
    }
  }, [user, navigate]);

  // Sync mode state with URL query params when they change
  useEffect(() => {
    setMode(isSignup ? "signup" : "signin");
  }, [isSignup]);

  // Handle email confirmation callback and hash fragments
  useEffect(() => {
    const handleAuthCallback = async () => {
      // Check for email confirmation token in URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");

      if (accessToken && type === "signup") {
        // User confirmed email via redirect
        const { data: { session }, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get("refresh_token") || "",
        });

        if (session && !error) {
          toast.success("Email confirmed! Welcome!");
          navigate("/profile");
        }
      }

      // Also check for confirmed query param
      const confirmed = searchParams.get("confirmed");
      if (confirmed === "true") {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          toast.success("Email confirmed! You can now sign in.");
          setSearchParams({});
        }
      }
    };
    handleAuthCallback();
  }, [searchParams, setSearchParams, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (mode === "signup") {
        if (!name.trim() || !industry || !email.trim() || !password.trim()) {
          toast.error("Please fill in all fields");
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          toast.error("Password must be at least 6 characters");
          setLoading(false);
          return;
        }

        // Sign up user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              industry: industry,
            },
            emailRedirectTo: window.location.origin + "/auth?confirmed=true",
          },
        });

        if (authError) {
          toast.error(authError.message);
          setLoading(false);
          return;
        }

        // Check if email confirmation is required
        if (authData.user && !authData.session) {
          toast.success("Check your email to confirm your account, then sign in!");
          setMode("signin");
          setSearchParams({});
          setLoading(false);
          return;
        }

        // Create profile in profiles table
        if (authData.user && authData.session) {
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: authData.user.id,
              email: authData.user.email,
              full_name: name,
              industry: industry,
            });

          if (profileError) {
            console.error("Profile creation error:", profileError);
            // Continue anyway as auth was successful
          }

          toast.success("Welcome to LinkedOut! Ready to embrace your failures.");
          navigate("/profile");
        }
      } else {
        if (!email.trim() || !password.trim()) {
          toast.error("Please enter your email and password");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Check if it's an unconfirmed email error
          if (error.message.includes("Email not confirmed") || error.message.includes("email_not_confirmed")) {
            toast.error("Please check your email and click the confirmation link before signing in.");
          } else {
            toast.error(error.message);
          }
          setLoading(false);
          return;
        }

        if (data.session) {
          toast.success("Welcome back! Your failures missed you.");
          navigate("/profile");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
      setLoading(false);
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
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {mode === "signin" ? "Signing In..." : "Creating Account..."}
                      </>
                    ) : (
                      mode === "signin" ? "Sign In" : "Create Account"
                    )}
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
