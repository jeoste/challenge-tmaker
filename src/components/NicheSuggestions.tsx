import { useState } from "react";

const niches = [
  { name: "Notion" },
  { name: "Fitness" },
  { name: "Recruitment" },
  { name: "SaaS" },
  { name: "Devtools" },
];

interface NicheSuggestionsProps {
  visible: boolean;
}

export const NicheSuggestions = ({ visible }: NicheSuggestionsProps) => {
  const [activeNiche, setActiveNiche] = useState<string | null>("SaaS");

  if (!visible) return null;

  return (
    <div className="w-full max-w-[680px] mx-auto mt-6 fade-in">
      <div className="flex flex-wrap justify-center gap-3">
        {niches.map((niche, index) => (
          <button
            key={niche.name}
            onClick={() => setActiveNiche(niche.name)}
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
