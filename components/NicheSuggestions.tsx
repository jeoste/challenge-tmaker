"use client";

import { useRouter } from "next/navigation";

// The 5 main niches on the landing page
const niches = [
  { name: "SaaS & Indie Hacking", id: "saas & indie hacking" },
  { name: "Dropshipping", id: "dropshipping" },
  { name: "Data & Analytics", id: "data & analytics" },
  { name: "Workflow Automation", id: "workflow automation" },
  { name: "Developer Tools", id: "developer tools" },
];

const sources = [
  { name: "Reddit", id: "reddit", available: true },
  { name: "Meta", id: "meta", available: false },
  { name: "LinkedIn", id: "linkedin", available: false },
  { name: "X (Twitter)", id: "twitter", available: false }
];

const problemTypes = [
  { name: "Pain points", id: "pain-points" },
  { name: "Alternatives", id: "alternatives" },
  { name: "Questions", id: "questions" }
];

const engagementLevels = [
  {
    name: "Viral",
    id: "viral",
    description: "100+ upvotes or 50+ comments"
  },
  {
    name: "High engagement",
    id: "high",
    description: "20+ upvotes or 10+ comments"
  },
  {
    name: "All posts",
    id: "all",
    description: "All posts"
  }
];

interface NicheSuggestionsProps {
  visible: boolean;
  onNicheSelect?: (niche: { name: string; id: string }) => void;
  onSourceSelect?: (source: { name: string; id: string; available: boolean }) => void;
  onProblemTypeSelect?: (type: { name: string; id: string }) => void;
  onEngagementSelect?: (level: { name: string; id: string; description: string }) => void;
  selectedNiche?: string | null;
  selectedSource?: string | null;
  selectedProblemType?: string | null;
  selectedEngagementLevel?: string | null;
}

export const NicheSuggestions = ({ 
  visible,
  onNicheSelect,
  onSourceSelect,
  onProblemTypeSelect,
  onEngagementSelect,
  selectedNiche,
  selectedSource,
  selectedProblemType,
  selectedEngagementLevel
}: NicheSuggestionsProps) => {
  const router = useRouter();

  if (!visible) return null;

  // Determine the current step for display
  // Always show step 1, then subsequent steps if previous selections are made
  const showStep1 = true;
  const showStep2 = selectedNiche !== null;
  const showStep3 = selectedSource !== null;
  const showStep4 = selectedProblemType !== null;

  const handleNicheClick = (niche: { name: string; id: string }) => {
    onNicheSelect?.(niche);
  };

  const handleSourceClick = (source: { name: string; id: string; available: boolean }) => {
    if (!source.available) return;
    onSourceSelect?.(source);
  };

  const handleProblemTypeClick = (type: { name: string; id: string }) => {
    onProblemTypeSelect?.(type);
  };

  const handleEngagementClick = (level: { name: string; id: string; description: string }) => {
    onEngagementSelect?.(level);
    
    // Build URL with all parameters and navigate
    const params = new URLSearchParams();
    if (selectedSource) params.set('source', selectedSource);
    if (selectedProblemType) params.set('type', selectedProblemType);
    if (level.id !== 'all') params.set('engagement', level.id);
    
    const queryString = params.toString();
    const url = `/results/${encodeURIComponent(selectedNiche || '')}${queryString ? `?${queryString}` : ''}`;
    router.push(url);
  };

  return (
    <div className="w-full max-w-[680px] mx-auto mt-6 space-y-8" data-search-suggestions>
      {/* Step 1: Niches */}
      {showStep1 && (
        <div className="fade-in">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide text-center">
              Step 1
            </h3>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {niches.map((niche, index) => (
              <button
                key={niche.name}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNicheClick(niche);
                }}
                disabled={showStep2}
                className={`stagger-item suggestion-btn px-8 py-3 text-sm font-medium text-foreground ${
                  selectedNiche === niche.id ? 'active' : ''
                } ${showStep2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {niche.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Sources */}
      {showStep2 && (
        <div className="fade-in">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide text-center">
              Step 2
            </h3>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {sources.map((source, index) => (
              <button
                key={source.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSourceClick(source);
                }}
                disabled={!source.available || showStep3}
                className={`stagger-item suggestion-btn px-8 py-3 text-sm font-medium text-foreground relative ${
                  selectedSource === source.id ? 'active' : ''
                } ${!source.available ? 'opacity-60 cursor-not-allowed' : ''} ${showStep3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {source.name}
                {!source.available && (
                  <span className="absolute -top-1 -right-1 bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded">
                    Coming soon
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Problem Types */}
      {showStep3 && (
        <div className="fade-in">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide text-center">
              Step 3
            </h3>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {problemTypes.map((type, index) => (
              <button
                key={type.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleProblemTypeClick(type);
                }}
                disabled={showStep4}
                className={`stagger-item suggestion-btn px-8 py-3 text-sm font-medium text-foreground ${
                  selectedProblemType === type.id ? 'active' : ''
                } ${showStep4 ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {type.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Engagement Levels */}
      {showStep4 && (
        <div className="fade-in">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide text-center">
              Step 4
            </h3>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {engagementLevels.map((level, index) => (
              <button
                key={level.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleEngagementClick(level);
                }}
                className={`stagger-item suggestion-btn px-8 py-3 text-sm font-medium text-foreground ${
                  selectedEngagementLevel === level.id ? 'active' : ''
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex flex-col items-center">
                  <span>{level.name}</span>
                  <span className="text-xs text-muted-foreground mt-1">{level.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
