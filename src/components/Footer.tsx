import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-12" style={{ borderBottom: 'none', border: 'none' }}>
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
          <div className="flex items-center gap-0 mb-4">
  <span className="text-2xl font-bold pr-1">Lucked</span>
  <span className="text-2xl font-bold bg-primary text-primary-foreground pl-1 pr-1.5 py-0.5">Out</span>
</div>
            <p className="text-sm opacity-80">
              Basically evil Linkedin.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4 uppercase tracking-wide">Resources</h4>
            <div className="space-y-2">
              <Link to="/manifesto" className="block hover:text-primary transition-colors">Manifesto</Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4 uppercase tracking-wide">Support</h4>
            <div className="space-y-2">
              <Link to="/help" className="block hover:text-primary transition-colors">Help Center</Link>
              <Link to="/contact" className="block hover:text-primary transition-colors">Contact Us</Link>
              <Link to="/faq" className="block hover:text-primary transition-colors">FAQ</Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4 uppercase tracking-wide">Legal</h4>
            <div className="space-y-2">
              <Link to="/privacy" className="block hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="block hover:text-primary transition-colors">Terms of Service</Link>
              <Link to="/cookies" className="block hover:text-primary transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-background/20 mt-8 pt-8 text-center text-sm opacity-60">
          © 2024 LuckedOut. All failures reserved.
        </div>
      </div>
    </footer>
  );
}
