"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const niches = [
  { name: "Notion", id: "notion" },
  { name: "Fitness", id: "fitness" },
  { name: "Recruitment", id: "recruitment" },
  { name: "SaaS", id: "saas" },
  { name: "Devtools", id: "devtools" },
];

interface NicheSuggestionsProps {
  visible: boolean;
}

export const NicheSuggestions = ({ visible }: NicheSuggestionsProps) => {
  const [activeNiche, setActiveNiche] = useState<string | null>("SaaS");
  const router = useRouter();

  if (!visible) return null;

  const handleClick = (niche: { name: string; id: string }) => {
    setActiveNiche(niche.name);
    router.push(`/results/${niche.id}`);
  };

  return (
    <div className="w-full max-w-[680px] mx-auto mt-6 fade-in">
      <div className="flex flex-wrap justify-center gap-3">
        {niches.map((niche, index) => (
          <button
            key={niche.name}
            onClick={() => handleClick(niche)}
            className={`stagger-item suggestion-btn px-8 py-3 text-sm font-medium text-foreground ${
              activeNiche === niche.name ? 'active' : ''
            }`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {niche.name}
          </button>
        ))}
      </div>
    </div>
  );
};
