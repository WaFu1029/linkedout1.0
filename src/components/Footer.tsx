import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-12 mt-20">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
          <div className="flex items-center gap-0 mb-4">
  <span className="text-2xl font-bold pr-1">Linked</span>
  <span className="text-2xl font-bold bg-primary text-primary-foreground pl-1 pr-1.5 py-0.5">Out</span>
</div>
            <p className="text-sm opacity-80">
              Basically evil Linkedin.
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
            <h4 className="font-bold mb-4 uppercase tracking-wide">Why?</h4>
            <p className="text-sm opacity-80">
              Success is overrated. Failure is human.
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
