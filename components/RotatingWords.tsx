"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface RotatingWordsProps {
  words: string[];
  className?: string;
  interval?: number;
}

export const RotatingWords = ({ 
  words, 
  className,
  interval = 3000 
}: RotatingWordsProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'out' | 'in'>('out');

  useEffect(() => {
    if (words.length <= 1) return;

    const timer = setInterval(() => {
      // Slide out to the right
      setIsAnimating(true);
      setDirection('out');
      
      // Wait for slide out, then change word and slide in from left
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setDirection('in');
        
        // Small delay before slide in
        setTimeout(() => {
          setIsAnimating(false);
        }, 50);
      }, 300);
    }, interval);

    return () => clearInterval(timer);
  }, [words, interval]);

  // Calculate max width needed for all words
  const maxWidth = Math.max(...words.map(w => w.length)) * 0.6; // Approximate width in em

  return (
    <span 
      className={cn(
        "inline-block relative overflow-hidden",
        className
      )}
      style={{
        minWidth: `${maxWidth}em`,
        verticalAlign: 'baseline',
      }}
    >
      <span
        className={cn(
          "inline-block transition-all",
          isAnimating 
            ? direction === 'out'
              ? "opacity-0 translate-x-8" 
              : "opacity-0 -translate-x-8"
            : "opacity-100 translate-x-0"
        )}
        style={{
          transitionDuration: '400ms',
          transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          verticalAlign: 'baseline',
        }}
      >
        {words[currentIndex]}
      </span>
    </span>
  );
};
