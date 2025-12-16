import { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, Users, Archive, MessageSquare } from "lucide-react";
import { useTheme } from "next-themes";

const TypingText = ({ text, speed = 100, onComplete, showPreExplosion }: { text: string; speed?: number; onComplete?: () => void; showPreExplosion?: boolean }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [isPreExploding, setIsPreExploding] = useState(false);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText("");
    setIsTyping(true);
    setIsPreExploding(false);
    
    let currentIndex = 0;
    let isCancelled = false;
    
    const typingInterval = setInterval(() => {
      if (isCancelled) {
        clearInterval(typingInterval);
        return;
      }
      
      if (currentIndex < text.length) {
        const currentSlice = text.slice(0, currentIndex + 1);
        setDisplayedText(currentSlice);
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        if (onComplete && !isCancelled && showPreExplosion) {
          // Wait before starting pre-explosion
          setTimeout(() => {
            const totalTypingTime = text.length * speed;
            const additionalDelay = totalTypingTime * 0.5;
            setIsPreExploding(true);
            setTimeout(() => {
              if (!isCancelled && onComplete) {
                setIsPreExploding(false);
                onComplete();
              }
            }, additionalDelay);
          }, 500);  // <-- Wait 1 second after typing finishes before anything happens
        } else if (onComplete && !isCancelled) {
          setTimeout(() => {
            if (!isCancelled && onComplete) {
              onComplete();
            }
          }, 100);
        }
      }
    }, speed);

    return () => {
      isCancelled = true;
      clearInterval(typingInterval);
    };
  }, [text, speed, onComplete, showPreExplosion, isDark]);

  // Split by newlines and handle each line separately
  const lines = displayedText.split('\n');
  const allChars = displayedText.replace(/\n/g, '').split('');
  const centerIndex = Math.floor(allChars.length / 2);

  return (
    <span className={isPreExploding ? "pre-explosion-text" : ""}>
      {lines.map((line, lineIndex) => {
        const charsBeforeThisLine = lines.slice(0, lineIndex).join('\n').replace(/\n/g, '').length;
        
        return (
          <span key={lineIndex}>
            {line.split('').map((char, charIndex) => {
              const globalIndex = charsBeforeThisLine + charIndex;
              const distanceFromCenter = Math.abs(globalIndex - centerIndex);
              const direction = globalIndex < centerIndex ? -1 : 1;
              const offset = distanceFromCenter * 3;
              
              return (
                <span
                  key={`${lineIndex}-${charIndex}`}
                  className={isPreExploding ? "inline-block" : "inline"}
                  style={isPreExploding ? {
                    animation: isDark ? `pre-explode-char-dark 0.75s ease-out forwards` : `pre-explode-char 0.75s ease-out forwards`,
                    animationDelay: `${(distanceFromCenter / allChars.length) * 0.2}s`,
                    transformOrigin: 'center',
                    '--offset': `${offset}px`,
                    '--direction': direction,
                  } as React.CSSProperties & { '--offset': string; '--direction': number } : {}}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              );
            })}
            {lineIndex < lines.length - 1 && <br />}
          </span>
        );
      })}
      {isTyping && <span className="animate-pulse">_</span>}
    </span>
  );
};

const Explosion = ({ show, text, onComplete }: { show: boolean; text?: string; onComplete?: () => void }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const particles = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => {  // More particles
      const angle = (360 / 60) * i;
      const angleRad = (angle * Math.PI) / 180;
      const distance = 400 + Math.random() * 300;  // Fly further
      const delay = Math.random() * 0.15;  // Faster start
      const size = 30 + Math.random() * 60;  // Bigger particles
      const isRed = Math.random() > 0.5;
      const x = Math.cos(angleRad) * distance;
      const y = Math.sin(angleRad) * distance;
      
      // Use lilac colors in dark mode, orange in light mode
      const color1 = isDark ? '#a78bfa' : '#ef4444'; // Light lilac or red
      const color2 = isDark ? '#c084fc' : '#f97316'; // Medium lilac or orange
      
      return {
        id: i,
        angle,
        x,
        y,
        delay,
        size,
        color: isRed ? color1 : color2,
      };
    });
  }, [isDark]);

  const [textFragments] = useState(() => {
    if (!text) return [];
    return text.split('').map((char, i) => {
      const angle = (360 / text.length) * i + Math.random() * 40 - 20;  // More chaotic spread
      const angleRad = (angle * Math.PI) / 180;
      const distance = 350 + Math.random() * 250;  // Letters fly further
      const delay = Math.random() * 0.1;  // Faster
      const x = Math.cos(angleRad) * distance;
      const y = Math.sin(angleRad) * distance;
      
      return {
        id: `char-${i}`,
        char: char === ' ' ? '\u00A0' : char,
        angle,
        x,
        y,
        delay,
      };
    });
  });

  useEffect(() => {
    if (!show) return;

    const styleSheet = document.createElement('style');
    const particleKeyframes = particles.map((p) => `
      @keyframes explode-${p.id} {
        0% {
          transform: translate(-50%, -50%) rotate(${p.angle}deg) scale(0);
          opacity: 1;
        }
        100% {
          transform: translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px)) rotate(${p.angle}deg) scale(1);
          opacity: 0;
        }
      }
    `).join('');

    const textKeyframes = textFragments.map((f) => `
      @keyframes explode-text-${f.id} {
        0% {
          transform: translate(-50%, -50%) rotate(${f.angle}deg) scale(1);
          opacity: 1;
        }
        100% {
          transform: translate(calc(-50% + ${f.x}px), calc(-50% + ${f.y}px)) rotate(${f.angle}deg) scale(0.5);
          opacity: 0;
        }
      }
    `).join('');

    styleSheet.textContent = particleKeyframes + textKeyframes;
    document.head.appendChild(styleSheet);

    // Call onComplete after animation finishes (1.5s + max delay)
    const timeout = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 1800);

    return () => {
      document.head.removeChild(styleSheet);
      clearTimeout(timeout);
    };
  }, [show, particles, textFragments, onComplete, isDark]);

  if (!show) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 10 }}>
      {/* Text fragments */}
      {textFragments.map((fragment) => (
        <span
          key={fragment.id}
          className="absolute text-5xl md:text-7xl font-bold"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            animation: `explode-text-${fragment.id} 1.5s ease-out ${fragment.delay}s forwards`,
            transformOrigin: 'center',
          }}
        >
          {fragment.char}
        </span>
      ))}
      {/* Triangle particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            width: 0,
            height: 0,
            borderLeft: `${particle.size}px solid transparent`,
            borderRight: `${particle.size}px solid transparent`,
            borderBottom: `${particle.size * 1.5}px solid ${particle.color}`,
            transform: `translate(-50%, -50%) rotate(${particle.angle}deg)`,
            animation: `explode-${particle.id} 1.5s ease-out ${particle.delay}s forwards`,
            transformOrigin: 'center',
          }}
        />
      ))}
    </div>
  );
};

const Index = () => {
  const [showExplosion, setShowExplosion] = useState(false);
  const [showNewText, setShowNewText] = useState(false);
  const [hasTypedFirstText, setHasTypedFirstText] = useState(false);
  const [showWhyText, setShowWhyText] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className={`min-h-[calc(100vh-64px)] flex items-center justify-center pt-48 pb-48 md:pt-56 md:pb-64 ${showExplosion ? 'animate-screen-shake' : ''}`}>        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center relative">
            <div className="inline-block bg-foreground text-background px-4 py-2 mb-6 border-[3px] border-foreground font-mono text-sm">
              BASICALLY EVIL LINKEDIN
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight relative">
            {showNewText ? (
  <span className="block min-h-[2.4em]">
    <TypingText 
      key="new-text"
      text={"Here's something that\nabsolutely flopped ..."} 
      speed={50}
      onComplete={() => setShowWhyText(true)}
    />
  </span>
) : hasTypedFirstText ? (
  <span className="block min-h-[2.4em]">
    <span className="invisible">I am excited to<br />announce...</span>
    {showExplosion && (
      <Explosion 
        show={showExplosion}
        text={"I am excited to\nannounce..."}
        onComplete={() => setShowNewText(true)}
      />
    )}
  </span>
) : (
                <span className="block min-h-[2.4em]">
                  <TypingText 
                    key="old-text"
                    text={"I am excited to\nannounce..."}
                    speed={50}
                    showPreExplosion={true}
                    onComplete={() => {
                      setHasTypedFirstText(true);
                      setShowExplosion(true);
                    }}
                  />
                </span>
              )}
            </h1>
            {showWhyText && (
              <div className="mb-6 min-h-[1.5em]">
                <TypingText 
                  key="why-text"
                  text="Why? Because perfection is boring, and vulnerability is brave."
                  speed={30}
                />
              </div>
            )}
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
              A social where we celebrate vulnerability, relate to rejection, and don't pretend to have it all figured out.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-300">
              <Button size="xl" asChild>
                <Link to="/auth?mode=signup">
                  Start Failing, Together <ArrowRight className="ml-2" />
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

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-primary-foreground">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to stop pretending?
            </h2>
            <Button
              size="xl"
              variant="outline"
              className="bg-primary-foreground text-foreground border-foreground hover:bg-secondary"
              asChild
            >
              <Link to="/auth?mode=signup">
                Let's Link Out <ArrowRight className="ml-2" />
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
