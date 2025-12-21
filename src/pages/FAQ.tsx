import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function FAQ() {
  const faqs = [
    {
      question: "What is LuckedOut?",
      answer: "LuckedOut is a platform that celebrates failure and vulnerability. Instead of showcasing only successes like traditional LinkedIn, we encourage users to share their failures, connect authentically, and build resilience together."
    },
    {
      question: "How do I earn points?",
      answer: "You earn 10 points every time someone likes your post! You can also sell harvested vegetables from your garden for 110% of their original cost."
    },
    {
      question: "How does the garden work?",
      answer: "Buy vegetables from the shop using points, plant them in your garden, wait for them to grow (growth time is proportional to their cost), then harvest them. Harvested vegetables go to your inventory, where you can plant them again, gift them, or sell them."
    },
    {
      question: "Can I gift vegetables to anyone?",
      answer: "You can gift vegetables to mutual connections from your profile, or gift directly to post authors from their posts. Gifts go directly to the recipient's inventory."
    },
    {
      question: "What happens if I don't log in for a while?",
      answer: "Your plants will continue growing while you're offline! When you log back in, we calculate the time that passed and update your plants' growth accordingly."
    },
    {
      question: "How do connections work?",
      answer: "Connections are mutual friendships. When you send a connection request and the other person accepts, you become connected. Only mutual connections can view each other's gardens."
    },
    {
      question: "What is the login streak?",
      answer: "Your login streak tracks consecutive days you've logged into LuckedOut. It resets if you miss a day, but you can build it back up by logging in daily!"
    },
    {
      question: "Can I delete my account?",
      answer: "Currently, account deletion is handled through your authentication provider. Contact support if you need assistance with account deletion."
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-8">Frequently Asked Questions</h1>
          
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-[3px] border-foreground rounded p-4">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pt-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>
      <Footer />
    </div>
  );
}

