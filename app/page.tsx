"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { NicheSuggestions } from "@/components/NicheSuggestions";
import { RotatingWords } from "@/components/RotatingWords";

export default function Home() {
  const [showSuggestions, setShowSuggestions] = useState(false);

  return (
    <div className="min-h-screen bg-mesh bg-grid">
      <Header />

      {/* Hero Section */}
      <main className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-20">
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 w-full max-w-4xl mx-auto text-center">
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-foreground mb-4 tracking-tight">
            Find hidden niches
            <br />
            <span className="text-gradient flex items-baseline justify-center gap-1">
              <span>on</span>
              <RotatingWords words={["Reddit", "Twitter", "Meta", "LinkedIn", "Discord"]} className="text-gradient" interval={2500} />
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-12">
            Ready-to-launch micro-SaaS blueprints
          </p>

          {/* Search Bar */}
          <SearchBar
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setShowSuggestions(false)}
          />

          {/* Niche Suggestions */}
          <NicheSuggestions visible={showSuggestions} />

          {/* Keyboard shortcut hint */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <kbd className="px-2 py-1 rounded bg-secondary/50 border border-border font-mono">⌘</kbd>
            <span>+</span>
            <kbd className="px-2 py-1 rounded bg-secondary/50 border border-border font-mono">K</kbd>
            <span className="ml-1">for quick search</span>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </main>
    </div>
  );
}
