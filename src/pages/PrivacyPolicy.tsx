import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <Card className="border-[3px] border-foreground shadow-brutal p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="space-y-6 text-lg leading-relaxed">
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4">Introduction</h2>
              <p>
                At LinkedOut, we respect your privacy and are committed to protecting your personal data. 
                This privacy policy explains how we collect, use, and safeguard your information when you 
                use our platform.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4">Information We Collect</h2>
              <p>We collect the following types of information:</p>
              <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                <li>Account information (email, name, industry)</li>
                <li>Profile information you choose to share</li>
                <li>Posts, comments, and reactions you create</li>
                <li>Garden and inventory data</li>
                <li>Connection information</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4">How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                <li>Provide and improve our services</li>
                <li>Enable social features (connections, gifts, reactions)</li>
                <li>Send notifications about your account activity</li>
                <li>Maintain your garden and inventory</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4">Data Security</h2>
              <p>
                We use industry-standard security measures to protect your data. Your information is 
                stored securely and accessed only by authorized systems. However, no method of transmission 
                over the internet is 100% secure.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4">Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and data</li>
                <li>Opt out of certain data processing</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4">Contact Us</h2>
              <p>
                If you have questions about this privacy policy, please contact us through our 
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
