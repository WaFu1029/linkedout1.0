import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <Card className="border-[3px] border-foreground shadow-brutal p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-8">Terms of Service</h1>
          
          <div className="space-y-6 text-lg leading-relaxed">
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4">Acceptance of Terms</h2>
              <p>
                By accessing and using LinkedOut, you accept and agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our platform.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4">Use of Service</h2>
              <p>You agree to:</p>
              <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                <li>Use LinkedOut only for lawful purposes</li>
                <li>Not engage in any fraudulent or abusive behavior</li>
                <li>Respect other users and their content</li>
                <li>Not attempt to manipulate the points or gift system</li>
                <li>Maintain the security of your account</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4">User Content</h2>
              <p>
                You retain ownership of content you post on LinkedOut. By posting, you grant us a license 
                to use, display, and distribute your content on the platform. You are responsible for 
                ensuring your content does not violate any laws or infringe on others' rights.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4">Prohibited Activities</h2>
              <p>You may not:</p>
              <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                <li>Create fake accounts or impersonate others</li>
                <li>Engage in point fraud or manipulation</li>
                <li>Harass, threaten, or harm other users</li>
                <li>Post spam, malicious content, or illegal material</li>
                <li>Attempt to hack or disrupt the platform</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4">Account Termination</h2>
              <p>
                We reserve the right to suspend or terminate accounts that violate these terms. You may 
                also delete your account at any time through your account settings.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4">Limitation of Liability</h2>
              <p>
                LinkedOut is provided "as is" without warranties. We are not liable for any damages 
                arising from your use of the platform. Your failures are your own responsibility.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4">Changes to Terms</h2>
              <p>
                We may update these terms from time to time. Continued use of LinkedOut after changes 
                constitutes acceptance of the new terms.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4">Contact</h2>
              <p>
                Questions about these terms? Contact us through our 
                <Link to="/contact" className="text-primary hover:underline ml-1">Contact Us</Link> page.
              </p>
            </section>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
