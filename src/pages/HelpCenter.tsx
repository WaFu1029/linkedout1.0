import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function HelpCenter() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-8">Help Center</h1>
          
          <div className="space-y-6">
            <p className="text-lg">
              Need help? You've come to the right place. Here are some common questions and answers.
            </p>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="getting-started">
                <AccordionTrigger className="text-left font-semibold">Getting Started</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-2">
                    To get started on LuckedOut, simply create an account and start sharing your failures! 
                    You can connect with others, build your garden, and embrace vulnerability.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="garden">
                <AccordionTrigger className="text-left font-semibold">How does the garden work?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-2">
                    Your garden is a space to grow and harvest vegetables. Buy seeds from the shop, plant them, 
                    wait for them to grow, then harvest them for your inventory. You can also gift vegetables 
                    to friends or sell them for points!
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="points">
                <AccordionTrigger className="text-left font-semibold">How do I earn points?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-2">
                    You earn 10 points every time someone likes your post! Points can be used to buy vegetables 
                    from the shop to plant in your garden.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="connections">
                <AccordionTrigger className="text-left font-semibold">What are connections?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-2">
                    Connections are mutual friendships on LuckedOut. When you connect with someone, you can 
                    view each other's gardens and gift vegetables to each other.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="notifications">
                <AccordionTrigger className="text-left font-semibold">How do notifications work?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-2">
                    You'll receive notifications for connection requests, comments on your posts, reactions 
                    to your posts, and gifts you receive. You can clear notifications, and they'll stay cleared 
                    permanently.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

