"use client";

import { Header } from "@/components/Header";
import { HowItWorks } from "@/components/HowItWorks";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
      </main>
    </div>
  );
}