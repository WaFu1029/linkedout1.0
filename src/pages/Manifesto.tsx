import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Manifesto() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-8">LuckedOut Manifesto</h1>
          
          <div className="space-y-6 text-lg leading-relaxed">
            <p className="text-xl font-semibold">
              Success is overrated. Failure is human.
            </p>
            
            <p>
              We live in a world obsessed with curated perfection. LinkedIn feeds us success stories, 
              polished achievements, and endless hustle culture. But what about the failures? The rejections? 
              The moments we'd rather forget?
            </p>
            
            <p>
              <strong>LuckedOut is different.</strong> We celebrate failure. We embrace vulnerability. 
              We believe that sharing our struggles makes us stronger, not weaker.
            </p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">Why Failure Matters</h2>
            
            <p>
              Every failure is a lesson. Every rejection is redirection. Every mistake is a stepping stone. 
              By hiding our failures, we rob others of the chance to learn from our experiences. By sharing 
              them, we create connection, empathy, and growth.
            </p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">Our Mission</h2>
            
            <p>
              To create a space where vulnerability is strength, where failure is celebrated, and where 
              authenticity trumps perfection. We're building a community that supports each other through 
              the ups and downs, because let's face it—we all have more downs than ups.
            </p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">Join Us</h2>
            
            <p>
              Share your failures. Connect with others who understand. Build a garden of resilience. 
              Because on LuckedOut, your failures are your greatest asset.
            </p>
            
            <p className="text-xl font-semibold mt-8 pt-8 border-t-[3px] border-foreground">
              All failures reserved. 🌱
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
