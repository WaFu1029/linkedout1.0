import { useState, useEffect, useMemo, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, Users, Archive, MessageSquare } from "lucide-react";
import { useTheme } from "next-themes";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend, ReferenceLine } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const TypingText = ({ text, speed = 100, onComplete, showPreExplosion, highlightWords = [] }: { text: string; speed?: number; onComplete?: () => void; showPreExplosion?: boolean; highlightWords?: string[] }) => {
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

  // Build a set of highlighted character positions based on the full target text (not displayedText)
  // This allows highlighting to work as characters are typed out
  const highlightedPositions = useMemo(() => {
    const positions = new Set<number>();
    const fullTextWithoutNewlines = text.replace(/\n/g, '');
    
    for (const word of highlightWords) {
      let searchIndex = 0;
      while (true) {
        const wordStart = fullTextWithoutNewlines.indexOf(word, searchIndex);
        if (wordStart === -1) break;
        
        for (let i = wordStart; i < wordStart + word.length; i++) {
          positions.add(i);
        }
        searchIndex = wordStart + 1;
      }
    }
    return positions;
  }, [text, highlightWords]);

  // Helper function to check if a character is part of a highlighted word
  const isInHighlightedWord = (lineIndex: number, charIndex: number, lines: string[]) => {
    const charsBeforeThisLine = lines.slice(0, lineIndex).join('\n').replace(/\n/g, '').length;
    const globalIndex = charsBeforeThisLine + charIndex;
    return highlightedPositions.has(globalIndex);
  };

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
              const isHighlighted = isInHighlightedWord(lineIndex, charIndex, lines);
              
              return (
                <span
                  key={`${lineIndex}-${charIndex}`}
                  className={isPreExploding ? "inline-block" : "inline"}
                  style={{
                    ...(isPreExploding ? {
                      animation: isDark ? `pre-explode-char-dark 0.75s ease-out forwards` : `pre-explode-char 0.75s ease-out forwards`,
                      animationDelay: `${(distanceFromCenter / allChars.length) * 0.2}s`,
                      transformOrigin: 'center',
                      '--offset': `${offset}px`,
                      '--direction': direction,
                    } as React.CSSProperties & { '--offset': string; '--direction': number } : {}),
                    ...(isHighlighted ? { color: '#a855f7' } : {})
                  }}
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

const chartData = [
  { 
    category: "Feel lonely/isolated", 
    percentage: 40,
    description: "Self-reported negative impact in survey synthesis"
  },
  { 
    category: "Social media fatigue", 
    percentage: 32,
    description: "Burnout/stress from social media use"
  },
  { 
    category: "Feel inadequate", 
    percentage: 40,
    description: "Negative social comparison response"
  },
];

const chartConfig = {
  percentage: {
    label: "Percentage",
    color: "hsl(var(--background))",
  },
} satisfies ChartConfig;

// Correlation data: upward social comparison vs appearance anxiety (r=0.546)
const correlationData = [
  { usc: 1, anxiety: 2.1 },
  { usc: 5.5, anxiety: 5.0 },
];

const correlationConfig = {
  anxiety: {
    label: "Appearance Anxiety",
    color: "#ffffff",
  },
} satisfies ChartConfig;

const Index = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const barChartContainerClassName = `border-[3px] ${isDark ? 'border-foreground/30' : 'border-white/30'} w-full md:w-[500px] h-[500px] p-4 flex-shrink-0 flex flex-col`;
  const barChartClassName = `flex-1 w-full min-h-0 ${isDark ? '[&_.recharts-cartesian-axis-tick_text]:fill-foreground' : '[&_.recharts-cartesian-axis-tick_text]:fill-white'}`;
  const statSquareClassName = `border-[3px] border-background ${isDark ? 'bg-card' : 'bg-white'} p-4 md:p-6 flex flex-col items-center justify-center flex-shrink-0 w-full md:w-[200px] h-[500px] box-border`;
  const statValueClassName = `text-6xl md:text-7xl font-bold ${isDark ? 'text-primary' : 'text-[#f97316]'} mb-4`;
  const lineChartContainerClassName = `border-[3px] ${isDark ? 'border-foreground/30' : 'border-white/30'} flex-1 min-w-0 w-full h-[500px] p-4 flex flex-col`;
  const lineChartClassName = `relative flex-1 w-full h-full aspect-none ${isDark ? '[&_.recharts-cartesian-axis-tick_text]:fill-foreground' : '[&_.recharts-cartesian-axis-tick_text]:fill-white'}`;
  const arrowBodyClassName = isDark ? "bg-foreground" : "bg-white";
  const arrowHeadClassName = `w-0 h-0 border-l-[35px] ${isDark ? 'border-l-foreground' : 'border-l-white'} border-y-[18px] border-y-transparent flex-shrink-0`;
  const whySectionClassName = `py-16 md:py-24 ${isDark ? 'bg-primary' : 'bg-[#f97316]'}`;
  const [showExplosion, setShowExplosion] = useState(false);
  const [showNewText, setShowNewText] = useState(false);
  const [hasTypedFirstText, setHasTypedFirstText] = useState(false);
  const [barChartVisible, setBarChartVisible] = useState(false);
  const [lineChartVisible, setLineChartVisible] = useState(false);
  const [statVisible, setStatVisible] = useState(false);
  const [statValue, setStatValue] = useState(0);
  const barChartRef = useRef<HTMLDivElement>(null);
  const lineChartRef = useRef<HTMLDivElement>(null);
  const statRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const barObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setBarChartVisible(true);
            barObserver.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    const lineObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setLineChartVisible(true);
            lineObserver.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    const statObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setStatVisible(true);
            statObserver.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (barChartRef.current) {
      barObserver.observe(barChartRef.current);
    }
    if (lineChartRef.current) {
      lineObserver.observe(lineChartRef.current);
    }
    if (statRef.current) {
      statObserver.observe(statRef.current);
    }

    return () => {
      barObserver.disconnect();
      lineObserver.disconnect();
      statObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!statVisible) return;

    const targetValue = 68;
    const duration = 1500; // 1.5 seconds
    const steps = targetValue;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep <= targetValue) {
        setStatValue(currentStep);
      } else {
        clearInterval(interval);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [statVisible]);

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
      highlightWords={["flopped"]}
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

      {/* Why Section */}
      <section className={whySectionClassName}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl text-left pl-4 md:pl-8 mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-background">
              Why? <br /> <br />
              Because comparison on social media causes social anxiety.
            </h2>
          </div>
            <div className="pl-4 md:pl-8 pr-4 md:pr-8">
              <div className="flex flex-col md:flex-row gap-4 md:items-stretch">
              <div ref={barChartRef} className={barChartContainerClassName}>
  <h3 className="text-lg md:text-xl font-bold mb-2 text-background flex-shrink-0">
    Social Media Users Report Feelings of Loneliness and Inadequacy
  </h3>
  <ChartContainer 
    config={chartConfig} 
    className={barChartClassName}
  >
  <BarChart
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 8,
                    top: 30,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid vertical={false} stroke={isDark ? "hsla(270, 30%, 92%, 0.3)" : "rgba(255, 255, 255, 0.3)"} />
                  <XAxis
                    dataKey="category"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fill: isDark ? "hsl(270, 30%, 92%)" : "#ffffff", fontSize: 12 }}
                    height={60}
                    interval={0}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={4}
                    tick={{ fill: isDark ? "hsl(270, 30%, 92%)" : "#ffffff", fontSize: 11 }}
                    domain={[0, 50]}
                    label={{ 
                      value: "Percentage of Users", 
                      angle: -90, 
                      position: "insideLeft", 
                      fill: isDark ? "hsl(270, 30%, 92%)" : "#ffffff",
                      style: { textAnchor: "middle", fontSize: "11px" }
                    }}
                    width={60}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent 
                      indicator="dot"
                      formatter={(value, name, props) => [
                        value + '%',
                        props.payload.description
                      ]}
                    />}
                  />
                  <Bar
                    dataKey="percentage"
                    fill={isDark ? "hsl(270, 30%, 92%)" : "#ffffff"}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={barChartVisible}
                    animationBegin={0}
                    animationDuration={1000}
                    label={{ 
                      position: "center", 
                      fill: isDark ? "hsl(270, 60%, 65%)" : "#f97316", 
                      fontSize: 20, 
                      fontWeight: "bold",
                      formatter: (value: number) => value + '%'
                    }}
                  />
                </BarChart>
              </ChartContainer>
                </div>
                
                {/* Stats Square */}
                <div ref={statRef} className={statSquareClassName}>
                <div className={statValueClassName}>
                    {statValue}%
                  </div>
                  <p className="text-sm md:text-base text-foreground text-center leading-relaxed">
                    Of studies on social media from 2010–2022 report a significant negative association with mental health.
                  </p>
                </div>
                
                {/* Correlation Line Graph */}
                {/* Correlation Line Graph */}
                <div ref={lineChartRef} className={lineChartContainerClassName}>
  <div className="flex-shrink-0">
    <h3 className="text-lg md:text-xl font-bold mb-1 text-background">
      Social Media Use Correlates with Social Comparison and Appearance Anxiety
    </h3>
    <p className="text-xs text-background/90 leading-tight">
    </p>
  </div>
  <div className="relative flex-1 w-full min-h-0 h-full">
    <ChartContainer 
      config={correlationConfig} 
      className={lineChartClassName + ' relative h-full'}
      style={{ aspectRatio: 'auto' }}
    >
  <LineChart
  data={correlationData}
  margin={{
    left: 12,
    right: 12,
    top: 12,
    bottom: 0,
  }}
  style={{ overflow: 'visible' }}
>
<CartesianGrid stroke={isDark ? "hsla(270, 30%, 92%, 0.3)" : "rgba(255, 255, 255, 0.3)"} strokeWidth={1} horizontalCoordinatesGenerator={(props) => [0, 1, 2, 3, 4, 5, 6].map(i => props.offset.top + (i * (props.height - props.offset.top) / 6))} verticalCoordinatesGenerator={(props) => [0, 1, 2, 3, 4, 5, 6].map(i => props.offset.left + (i * (props.width - props.offset.left - props.offset.right) / 6))} />
<XAxis
        dataKey="usc"
        tickLine={false}
        axisLine={false}
        tick={false}
        height={1}
        domain={[1, 7]}
        type="number"
      />
      <YAxis
        tickLine={false}
        axisLine={false}
        tick={{ fontSize: 0 }}
        width={1}
        domain={[2, 7]}
        tickCount={6}
      />
      <ChartTooltip
        cursor={false}
        content={<ChartTooltipContent 
          indicator="dot"
          formatter={() => ["Correlation: r=0.546, p<0.01", ""]}
        />}
      />
      <Line
        type="linear"
        dataKey="anxiety"
        stroke="transparent"
        strokeWidth={0}
        dot={false}
        activeDot={false}
        isAnimationActive={lineChartVisible}
        animationBegin={0}
        animationDuration={1000}
      />
    </LineChart>
    {/* Arrow overlay - positioned to match chart plot area */}
    <div 
      className="absolute pointer-events-none overflow-hidden z-10"
      style={{
        left: '12px',
        right: '12px',
        top: '12px',
        bottom: '0',
      }}
    >
      {/* Full arrow with body and head - starts at bottom-left corner, stops before top-right */}
      <div 
        className={'absolute pointer-events-none transition-opacity duration-1000 ' + (lineChartVisible ? 'opacity-100' : 'opacity-0')}
        style={{
          left: '0',
          bottom: '0',
          width: '95%',
          height: '18px',
          transform: lineChartVisible ? 'rotate(-38deg)' : 'rotate(-38deg) scaleX(0)',
          transformOrigin: '0 100%',
          transition: 'transform 1s ease-out',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Arrow body */}
        <div 
          className={arrowBodyClassName}
          style={{
            width: 'calc(100% - 35px)',
            height: '18px',
            flexShrink: 0,
          }}
        />
        {/* Arrow head */}
        <div 
          className={arrowHeadClassName}
          style={{
            flexShrink: 0,
          }}
        />
      </div>
    </div>
  </ChartContainer>
  </div>
</div>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {/* Feature 1 - Large */}
            <Card className="md:col-span-3 p-8 hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary border-[3px] border-foreground flex items-center justify-center">
                  <Heart className="text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold">Step 1: Share Your Failures</h3>
              </div>
              <p className="text-muted-foreground text-lg">
              If you got laid off, failed a class, or just miss your ex, post about it. That is, if you're comfortable. We don't judge.
              </p>
            </Card>

            {/* Feature 2 - Small */}
            <Card className="md:col-span-2 p-8 hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-accent border-[3px] border-foreground flex items-center justify-center">
                  <Users className="text-accent-foreground" />
                </div>
                <h3 className="text-2xl font-bold">Step 2: Receive Empathy</h3>
              </div>
              <p className="text-muted-foreground text-lg">
                Get rewarded for being vulnerable. It's a skill, really.
              </p>
            </Card>

            {/* Feature 3 - Small */}
            <Card className="md:col-span-2 p-8 hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary border-[3px] border-foreground flex items-center justify-center">
                  <MessageSquare className="text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold">Step 3: Find Others</h3>
              </div>
              <p className="text-muted-foreground text-lg">
                This is a social media platform, after all. Just don't do anything illegal (or be a jerk).
              </p>
            </Card>

            {/* Feature 4 - Large */}
            <Card className="md:col-span-3 p-8 hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary border-[3px] border-foreground flex items-center justify-center">
                  <Archive className="text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold">Step 4: Get Immortalized in The Wall</h3>
              </div>
              <p className="text-muted-foreground text-lg">
                <strong>The Wall</strong> is an anonymous, permanent archive of all failures ever posted. We keep it here so we can look back and see just how imperfect we <em>all</em> are.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-20 md:py-32 ${isDark ? 'bg-primary' : 'bg-[#f97316]'}`}>
        <div className="container mx-auto px-4 flex items-center justify-center min-h-[400px]">
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
