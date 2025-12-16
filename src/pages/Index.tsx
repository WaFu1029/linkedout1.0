import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, Users, Archive, MessageSquare } from "lucide-react";

const TypingText = ({ text, speed = 100 }: { text: string; speed?: number }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, speed);

    return () => clearInterval(typingInterval);
  }, [text, speed]);

  return (
    <span>
      {displayedText}
      {isTyping && <span className="animate-pulse">_</span>}
    </span>
  );
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="min-h-[calc(100vh-64px)] flex items-center justify-center pt-32 pb-48 md:pt-40 md:pb-64">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-foreground text-background px-4 py-2 mb-6 border-[3px] border-foreground font-mono text-sm">
              <TypingText text="THE ANTI-LINKEDIN" speed={80} />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-fade-in-up animation-delay-100">
              Share your <span className="text-primary">failures</span>.
              <br />
              Find your <span className="text-primary">people</span>.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
              A social platform where vulnerability is celebrated, rejections are shared, and nobody's pretending to have it all figured out.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-300">
              <Button size="xl" asChild>
                <Link to="/auth?mode=signup">
                  Start Failing Together <ArrowRight className="ml-2" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link to="/wall">
                  Visit The Wall
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-16 md:py-24 bg-secondary/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How it <span className="text-primary">works</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {/* Feature 1 - Large */}
            <Card className="md:col-span-2 p-8 hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary border-[3px] border-foreground flex items-center justify-center">
                  <Heart className="text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold">Share Your Failures</h3>
              </div>
              <p className="text-muted-foreground text-lg">
                Post about rejections, mistakes, and moments of vulnerability. Tag them, react with empathy, and let go of the pressure to perform perfection.
              </p>
            </Card>

            {/* Feature 2 - Small */}
            <Card className="p-8 hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px]">
              <div className="w-12 h-12 bg-accent border-[3px] border-foreground flex items-center justify-center mb-4">
                <Users className="text-accent-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Follower Counts</h3>
              <p className="text-muted-foreground">
                No vanity metrics. Just humans connecting over shared experiences.
              </p>
            </Card>

            {/* Feature 3 - Small */}
            <Card className="p-8 hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px]">
              <div className="w-12 h-12 bg-peach-soft border-[3px] border-foreground flex items-center justify-center mb-4">
                <Archive />
              </div>
              <h3 className="text-xl font-bold mb-2">2-Week Visibility</h3>
              <p className="text-muted-foreground">
                Posts fade from public view after 2 weeks. Your archive stays private forever.
              </p>
            </Card>

            {/* Feature 4 - Large */}
            <Card className="md:col-span-2 p-8 hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-cream-warm border-[3px] border-foreground flex items-center justify-center">
                  <MessageSquare />
                </div>
                <h3 className="text-2xl font-bold">The Wall</h3>
              </div>
              <p className="text-muted-foreground text-lg">
                An anonymous, permanent archive of all failures ever posted. No names attached—just the failure text and tags. A monument to human imperfection.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Reactions Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              React with <span className="text-primary">empathy</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              No likes. No claps. Just four ways to say "I see you":
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="reaction" size="lg" className="text-base">
                Same 🙃
              </Button>
              <Button variant="reaction" size="lg" className="text-base">
                It's ok 💛
              </Button>
              <Button variant="reaction" size="lg" className="text-base">
                You're doing great! ✨
              </Button>
              <Button variant="reaction" size="lg" className="text-base">
                You got this! 💪
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-primary-foreground">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to stop pretending?
            </h2>
            <p className="text-xl opacity-90 mb-10">
              Join a community where your failures are celebrated, your vulnerabilities are safe, and nobody's counting your followers.
            </p>
            <Button
              size="xl"
              variant="outline"
              className="bg-primary-foreground text-foreground border-foreground hover:bg-secondary"
              asChild
            >
              <Link to="/auth?mode=signup">
                Join LinkedOut <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
