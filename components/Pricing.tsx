"use client";

import { Check, X } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

const freePlan = {
  name: "Free",
  price: "$0",
  period: "forever",
  description: "Perfect for getting started",
  features: [
    "3 niche searches per day",
    "Basic Reddit analysis",
    "Limited blueprints",
    "Basic sharing",
  ],
  limitations: [
    "No advanced AI features",
    "No export options",
    "Limited customer support",
  ],
  cta: "Get started free",
  popular: false,
};

const premiumPlan = {
  name: "Pro",
  price: "$19",
  period: "per month",
  description: "Unlock the full potential",
  features: [
    "Unlimited niche searches",
    "Advanced AI analysis",
    "Complete blueprints",
    "Advanced sharing & export",
    "Priority support",
    "Early access to new features",
  ],
  limitations: [], // Empty array to maintain alignment with Free plan
  cta: "Subscribe now",
  popular: true,
};

export const Pricing = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleFreePlan = () => {
    // Redirect to signup page
    window.location.href = '/signup';
  };

  const handlePremiumPlan = async () => {
    // If user is not logged in, redirect to signup
    if (!user) {
      window.location.href = '/signup?plan=premium';
      return;
    }

    setLoading(true);
    try {
      // Create checkout session via API
      const response = await fetch('/api/polar/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Polar checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast.error(error.message || 'Failed to start checkout process');
      setLoading(false);
    }
  };

  return (
    <section id="pricing" className="py-24 px-6 relative">
      {/* Background glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/3 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground mb-4 tracking-tight">
            Choose your plan
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Start with our free plan and upgrade to Pro when you're ready to unlock the full potential
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="glass-card p-8 relative overflow-hidden">
            <div className="relative z-10">
              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold text-foreground mb-2">
                  {freePlan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-4xl font-bold text-foreground">
                    {freePlan.price}
                  </span>
                  <span className="text-muted-foreground">
                    {freePlan.period}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  {freePlan.description}
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {freePlan.features.map((feature, index) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 stagger-item"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                    <span className="text-foreground text-sm">{feature}</span>
                  </div>
                ))}

                {freePlan.limitations.map((limitation, index) => (
                  <div
                    key={limitation}
                    className="flex items-center gap-3 stagger-item"
                    style={{ animationDelay: `${(freePlan.features.length + index) * 0.05}s` }}
                  >
                    <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                      <X className="w-3 h-3 text-red-500" />
                    </div>
                    <span className="text-muted-foreground text-sm">{limitation}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Button
                onClick={handleFreePlan}
                variant="outline"
                className="w-full py-6 text-base font-semibold border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
              >
                {freePlan.cta}
              </Button>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="glass-card p-8 relative overflow-hidden">
            {/* Popular Badge */}
            {premiumPlan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="bg-gradient-to-r from-primary to-purple-500 text-foreground text-xs font-semibold px-4 py-2 rounded-full">
                  Most Popular
                </div>
              </div>
            )}

            {/* Gradient border effect */}
            <div className="absolute inset-0 rounded-xl opacity-50">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 via-purple-500/20 to-primary/20 blur-xl" />
            </div>

            <div className="relative z-10">
              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold text-foreground mb-2">
                  {premiumPlan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-4xl font-bold text-foreground">
                    {premiumPlan.price}
                  </span>
                  <span className="text-muted-foreground">
                    {premiumPlan.period}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  {premiumPlan.description}
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {premiumPlan.features.map((feature, index) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 stagger-item"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-foreground text-sm">{feature}</span>
                  </div>
                ))}

                {premiumPlan.limitations.map((limitation, index) => (
                  <div
                    key={limitation}
                    className="flex items-center gap-3 stagger-item"
                    style={{ animationDelay: `${(premiumPlan.features.length + index) * 0.05}s` }}
                  >
                    <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                      <X className="w-3 h-3 text-red-500" />
                    </div>
                    <span className="text-muted-foreground text-sm">{limitation}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Button
                onClick={handlePremiumPlan}
                disabled={loading}
                className="w-full py-6 text-base font-semibold bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-foreground border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Chargement...' : premiumPlan.cta}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
