"use client";

import { Search, Sparkles, FileText, Rocket } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: Search,
    title: "Search a niche",
    description: "Type a niche or choose from suggestions",
  },
  {
    number: 2,
    icon: Sparkles,
    title: "AI scans Reddit",
    description: "AI analyzes Reddit posts to find pain points",
  },
  {
    number: 3,
    icon: FileText,
    title: "Get blueprints",
    description: "Get ready-to-launch SaaS blueprints with market insights",
  },
  {
    number: 4,
    icon: Rocket,
    title: "Launch your SaaS",
    description: "Start building with validated ideas and clear market signals",
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 px-6 relative">
      {/* Background glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/3 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground mb-4 tracking-tight">
            How it works
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Find validated SaaS ideas in seconds
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="stagger-item glass-card p-6 hover:scale-[1.02] transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Step Number Badge */}
                <div className="relative inline-flex items-center justify-center mb-4">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 blur-md" />
                  <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-foreground">
                      {step.number}
                    </span>
                  </div>
                </div>

                {/* Icon */}
                <div className="mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
