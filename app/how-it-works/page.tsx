"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HowItWorks } from "@/components/HowItWorks";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    category: "General",
    items: [
      {
        question: "What is Unearth?",
        answer: "Unearth is a platform that automatically scans data sources and social media platforms to identify pain points and generate ready-to-launch micro-SaaS blueprints. It helps entrepreneurs find validated business ideas by analyzing real user discussions and problems.",
      },
      {
        question: "How does it work?",
        answer: "Simply enter a niche or topic you&apos;re interested in. Unearth scans relevant data sources, identifies common pain points, and uses AI to generate detailed blueprints including market size estimates, MRR projections, and solution ideas.",
      },
      {
        question: "What data sources does Unearth use?",
        answer: "Unearth analyzes various data sources including social media discussions, comments, and posts to identify patterns and pain points that could become business opportunities.",
      },
    ],
  },
  {
    category: "Pricing & Plans",
    items: [
      {
        question: "What&apos;s the difference between the Free and Pro plans?",
        answer: "The Free plan includes 3 niche searches per day, basic data analysis, and limited blueprints. The Pro plan ($19/month) offers unlimited searches, advanced AI analysis, complete blueprints, advanced sharing & export features, priority support, and early access to new features.",
      },
      {
        question: "Is there a free trial for the Pro plan?",
        answer: "No, there is no free trial for the Pro plan. The Free plan itself serves as a way to try out the service. When you&apos;re ready to upgrade, you can subscribe to Pro for $19/month with immediate access to all premium features.",
      },
      {
        question: "Can I get a refund?",
        answer: "No, we do not offer refunds for subscription fees. All payments are final, including partial refunds for unused portions of the subscription period. You can cancel your subscription at any time, and it will remain active until the end of your current billing period.",
      },
    ],
  },
  {
    category: "Features & Usage",
    items: [
      {
        question: "How many searches can I do per day?",
        answer: "Free plan users can perform 3 niche searches per day. Pro plan users have unlimited searches with no daily restrictions.",
      },
      {
        question: "What information is included in a blueprint?",
        answer: "Each blueprint includes identified pain points, potential solution ideas, market size estimates, MRR (Monthly Recurring Revenue) projections, and actionable insights to help you validate and launch your micro-SaaS idea.",
      },
      {
        question: "Can I export my blueprints?",
        answer: "Export functionality is available to Pro plan subscribers. Free plan users have limited sharing options.",
      },
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-mesh bg-grid">
      <Header />

      {/* Back to home */}
      <div className="fixed top-20 left-6 z-40">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 glass-card hover:scale-105 transition-all duration-300 group"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            Back to home
          </span>
        </Link>
      </div>

      <main className="pt-20">
        <HowItWorks />

        {/* FAQ Section */}
        <section className="py-24 px-6 relative">
          {/* Background glow effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/3 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground mb-4 tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
                Find answers to common questions about Unearth
              </p>
            </div>

            <div className="space-y-8">
              {faqs.map((category) => (
                <div key={category.category} className="glass-card p-8 md:p-12">
                  <h3 className="text-2xl font-semibold text-foreground mb-6">
                    {category.category}
                  </h3>
                  <Accordion type="single" collapsible className="w-full">
                    {category.items.map((faq, index) => (
                      <AccordionItem
                        key={index}
                        value={`item-${category.category}-${index}`}
                        className="border-border"
                      >
                        <AccordionTrigger className="text-left text-foreground hover:no-underline">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>

            <div className="glass-card p-8 md:p-12 mt-8 text-center">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Still have questions?
              </h3>
              <p className="text-muted-foreground mb-4">
                Can&apos;t find the answer you&apos;re looking for? Contact us on{" "}
                <a
                  href="https://x.com/jeo_ste"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  X (Twitter)
                </a>
                {" "}or reach out through your account dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/pricing"
                  className="inline-block px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  View Pricing
                </Link>
                <a
                  href="https://insigh.to/b/unearth"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors"
                >
                  Feedback
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}