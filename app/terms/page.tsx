"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
        <div className="max-w-4xl mx-auto glass-card p-8 md:p-12">
          <h1 className="text-4xl font-semibold text-foreground mb-2">
            Terms of Service
          </h1>
          <p className="text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using Unearth (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                Unearth is a platform that scans Reddit and other social media platforms to identify pain points and generate micro-SaaS blueprints. The Service provides both free and premium subscription plans with different features and limitations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Subscription Plans</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Free Plan</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    The free plan provides limited access to the Service, including 3 niche searches per day, basic Reddit analysis, and limited blueprints. This plan is subject to usage restrictions and may be modified or discontinued at any time.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Pro Plan</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    The Pro plan is a monthly subscription priced at $19 per month. This plan provides unlimited niche searches, advanced AI analysis, complete blueprints, advanced sharing & export features, priority support, and early access to new features.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mt-2">
                    <strong>No Free Trial:</strong> The Pro plan does not include a free trial period. Payment is required immediately upon subscription.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mt-2">
                    <strong>No Refunds:</strong> All payments are final. We do not offer refunds for subscription fees, including partial refunds for unused portions of the subscription period.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Billing and Payment</h2>
              <p className="text-muted-foreground leading-relaxed">
                Subscriptions are billed monthly in advance. You will be charged $19 per month on a recurring basis until you cancel your subscription. All fees are non-refundable.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                You may cancel your subscription at any time through your account settings. Cancellation will take effect at the end of your current billing period, and you will continue to have access to Pro features until that time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Transmit any harmful, offensive, or illegal content</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use automated systems to access the Service in excess of normal usage</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service and its original content, features, and functionality are owned by Unearth and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Blueprints and analyses generated through the Service are provided for your use, but you may not resell, redistribute, or claim ownership of the underlying data or methodology.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service is provided &quot;as is&quot; without warranties of any kind, either express or implied. Unearth shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these Terms of Service at any time. We will notify users of any material changes by posting the new Terms of Service on this page and updating the "Last updated" date. Your continued use of the Service after such changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please contact us through the support channels available in your account dashboard.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
