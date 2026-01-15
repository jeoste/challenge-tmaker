"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQPage() {
  const faqs = [
    {
      category: "General",
      items: [
        {
          question: "What is Unearth?",
          answer: "Unearth is a platform that automatically scans Reddit and other social media platforms to identify pain points and generate ready-to-launch micro-SaaS blueprints. It helps entrepreneurs find validated business ideas by analyzing real user discussions and problems.",
        },
        {
          question: "How does it work?",
          answer: "Simply enter a niche or topic you're interested in. Unearth scans relevant Reddit posts, identifies common pain points, and uses AI to generate detailed blueprints including market size estimates, MRR projections, and solution ideas.",
        },
        {
          question: "What data sources does Unearth use?",
          answer: "Currently, Unearth primarily scans Reddit posts and discussions. We analyze subreddits, comments, and discussions to identify patterns and pain points that could become business opportunities.",
        },
      ],
    },
    {
      category: "Pricing & Plans",
      items: [
        {
          question: "What's the difference between the Free and Pro plans?",
          answer: "The Free plan includes 3 niche searches per day, basic Reddit analysis, and limited blueprints. The Pro plan ($19/month) offers unlimited searches, advanced AI analysis, complete blueprints, advanced sharing & export features, priority support, and early access to new features.",
        },
        {
          question: "Is there a free trial for the Pro plan?",
          answer: "No, there is no free trial for the Pro plan. The Free plan itself serves as a way to try out the service. When you're ready to upgrade, you can subscribe to Pro for $19/month with immediate access to all premium features.",
        },
        {
          question: "Can I get a refund?",
          answer: "No, we do not offer refunds for subscription fees. All payments are final, including partial refunds for unused portions of the subscription period. You can cancel your subscription at any time, and it will remain active until the end of your current billing period.",
        },
        {
          question: "How do I cancel my subscription?",
          answer: "You can cancel your subscription at any time through your account settings. Your subscription will remain active until the end of your current billing period, and you'll continue to have access to Pro features until that time.",
        },
        {
          question: "What happens if I cancel my subscription?",
          answer: "When you cancel, you'll retain access to Pro features until the end of your current billing period. After that, your account will automatically revert to the Free plan with its associated limitations.",
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
        {
          question: "How accurate are the market size and MRR estimates?",
          answer: "Our estimates are based on AI analysis of Reddit discussions and patterns. They should be used as starting points for further validation and research, not as definitive market data. Always conduct your own market research before making business decisions.",
        },
      ],
    },
    {
      category: "Account & Support",
      items: [
        {
          question: "How do I create an account?",
          answer: "Click the 'Sign up' button in the header, enter your email and create a password. You'll receive a confirmation email to verify your account.",
        },
        {
          question: "I forgot my password. How do I reset it?",
          answer: "On the login page, click 'Forgot password' and enter your email address. You'll receive instructions to reset your password.",
        },
        {
          question: "What kind of support do you offer?",
          answer: "Free plan users have access to basic support. Pro plan subscribers receive priority support with faster response times and dedicated assistance.",
        },
        {
          question: "How can I contact support?",
          answer: "You can contact support through the support channels available in your account dashboard. Pro users will receive priority assistance.",
        },
      ],
    },
    {
      category: "Technical",
      items: [
        {
          question: "Do you store my search history?",
          answer: "Yes, we store your search history and generated blueprints so you can access them later from your dashboard. This data is stored securely and is only accessible to you.",
        },
        {
          question: "Is my data secure?",
          answer: "Yes, we take data security seriously. All data is encrypted in transit and at rest. We use industry-standard security practices to protect your information.",
        },
        {
          question: "Can I use Unearth for commercial purposes?",
          answer: "Yes, the blueprints and insights generated through Unearth are intended for commercial use. However, you may not resell, redistribute, or claim ownership of the underlying data or methodology used by the Service.",
        },
      ],
    },
  ];

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

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-8 md:p-12 mb-8">
            <h1 className="text-4xl font-semibold text-foreground mb-2">
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground">
              Find answers to common questions about Unearth, our features, pricing, and more.
            </p>
          </div>

          <div className="space-y-8">
            {faqs.map((category) => (
              <div key={category.category} className="glass-card p-8 md:p-12">
                <h2 className="text-2xl font-semibold text-foreground mb-6">
                  {category.category}
                </h2>
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
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Still have questions?
            </h2>
            <p className="text-muted-foreground mb-4">
              Can't find the answer you're looking for? Please contact our support team through your account dashboard.
            </p>
            <Link
              href="/pricing"
              className="inline-block px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
