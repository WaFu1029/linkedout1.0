import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-8">Cookie Policy</h1>
          
          <div className="space-y-6 text-lg leading-relaxed">
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4">What Are Cookies?</h2>
              <p>
                Cookies are small text files stored on your device when you visit websites. They help 
                websites remember your preferences and improve your experience.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4">How We Use Cookies</h2>
              <p>LinkedOut uses cookies for:</p>
              <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                <li><strong>Authentication:</strong> To keep you logged in and secure your session</li>
                <li><strong>Preferences:</strong> To remember your theme settings and preferences</li>
                <li><strong>Analytics:</strong> To understand how users interact with our platform</li>
                <li><strong>Functionality:</strong> To enable features like notifications and garden state</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4">Types of Cookies</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-xl mb-2">Essential Cookies</h3>
                  <p>
                    These are necessary for LinkedOut to function. They enable core features like 
                    authentication and cannot be disabled.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">Functional Cookies</h3>
                  <p>
                    These remember your preferences and enhance your experience, such as theme 
                    selection and language preferences.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">Analytics Cookies</h3>
                  <p>
                    These help us understand how users interact with LinkedOut so we can improve 
                    the platform.
                  </p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4">Managing Cookies</h2>
              <p>
                You can control cookies through your browser settings. However, disabling certain 
                cookies may limit your ability to use some features of LinkedOut. Most browsers 
                allow you to:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                <li>View and delete cookies</li>
                <li>Block cookies from specific sites</li>
                <li>Block all cookies</li>
                <li>Delete all cookies when you close your browser</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4">Third-Party Cookies</h2>
              <p>
                We may use third-party services that set their own cookies. These services help us 
                provide and improve LinkedOut. We do not control these cookies, so please refer to 
                the respective privacy policies of these third parties.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4">Updates to This Policy</h2>
              <p>
                We may update this Cookie Policy from time to time. We'll notify you of any 
                significant changes by updating the "Last updated" date at the top of this page.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4">Contact</h2>
              <p>
                Questions about our use of cookies? Contact us through our 
                <Link to="/contact" className="text-primary hover:underline ml-1">Contact Us</Link> page.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
