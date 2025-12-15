import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-12 mt-20">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold">Linked</span>
              <span className="text-2xl font-bold bg-primary text-primary-foreground px-2">Out</span>
            </div>
            <p className="text-sm opacity-80">
              The anti-LinkedIn. Share your failures, embrace your vulnerabilities, and find community in imperfection.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4 uppercase tracking-wide">Navigate</h4>
            <div className="space-y-2">
              <Link to="/feed" className="block hover:text-primary transition-colors">Feed</Link>
              <Link to="/wall" className="block hover:text-primary transition-colors">The Wall</Link>
              <Link to="/auth" className="block hover:text-primary transition-colors">Sign In</Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4 uppercase tracking-wide">Manifesto</h4>
            <p className="text-sm opacity-80">
              Success is overrated. Here, we celebrate the stumbles, the rejections, and the beautiful mess of being human.
            </p>
          </div>
        </div>
        <div className="border-t border-background/20 mt-8 pt-8 text-center text-sm opacity-60">
          © 2024 LinkedOut. All failures reserved.
        </div>
      </div>
    </footer>
  );
}
