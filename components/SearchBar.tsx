"use client";

import { Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LiveBadge } from "./LiveBadge";

// Les 5 niches principales de la landing page
const niches = [
  { name: "SaaS & Indie Hacking", id: "saas & indie hacking" },
  { name: "Dropshipping", id: "dropshipping" },
  { name: "Data & Analytics", id: "data & analytics" },
  { name: "Workflow Automation", id: "workflow automation" },
  { name: "Developer Tools", id: "developer tools" },
];

interface SearchBarProps {
  onFocus?: () => void;
  onBlur?: () => void;
}

export const SearchBar = ({ onFocus, onBlur }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filtrer les niches en fonction de la query
  const filteredNiches = query.trim()
    ? niches.filter((niche) =>
        niche.name.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleFocus = () => {
    onFocus?.();
    if (query.trim() && filteredNiches.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Delay to allow clicking suggestions
    // Ne pas cacher les suggestions si l'utilisateur clique sur les étapes
    setTimeout(() => {
      // Vérifier si le focus est toujours dans la zone de recherche
      if (document.activeElement !== inputRef.current && 
          !document.activeElement?.closest('[data-search-suggestions]')) {
        setShowSuggestions(false);
        onBlur?.();
      }
    }, 200);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    if (value.trim() && filteredNiches.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectNiche = (niche: { name: string; id: string }) => {
    setQuery(niche.name);
    setShowSuggestions(false);
    router.push(`/results/${encodeURIComponent(niche.id)}`);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedIndex >= 0 && filteredNiches[selectedIndex]) {
      handleSelectNiche(filteredNiches[selectedIndex]);
    } else if (query.trim()) {
      router.push(`/results/${encodeURIComponent(query.trim().toLowerCase())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredNiches.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredNiches.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectNiche(filteredNiches[selectedIndex]);
    }
  };

  // Scroll selected suggestion into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="w-full max-w-[680px] mx-auto relative">
      <form onSubmit={handleSubmit}>
        <div className="search-floating rounded-2xl">
          <div className="flex items-center gap-3 px-5 py-4">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder='Type a niche (e.g. "Workflow Automation", "SaaS & Indie Hacking")'
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
              value={query}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
            />
            <LiveBadge />
          </div>
        </div>
      </form>
      
      {/* Autocomplete suggestions dropdown */}
      {showSuggestions && filteredNiches.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50 max-h-60 overflow-y-auto"
        >
          {filteredNiches.map((niche, index) => (
            <button
              key={niche.id}
              type="button"
              onClick={() => handleSelectNiche(niche)}
              className={`w-full text-left px-4 py-3 hover:bg-secondary transition-colors ${
                index === selectedIndex ? "bg-secondary" : ""
              }`}
            >
              <div className="text-sm font-medium text-foreground">{niche.name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
