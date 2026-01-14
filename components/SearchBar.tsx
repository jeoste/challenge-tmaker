"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LiveBadge } from "./LiveBadge";

interface SearchBarProps {
  onFocus?: () => void;
  onBlur?: () => void;
}

export const SearchBar = ({ onFocus, onBlur }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleFocus = () => {
    onFocus?.();
  };

  const handleBlur = () => {
    // Delay to allow clicking suggestions
    setTimeout(() => {
      onBlur?.();
    }, 200);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/results/${encodeURIComponent(query.trim().toLowerCase())}`);
    }
  };

  return (
    <div className="w-full max-w-[680px] mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="search-floating rounded-2xl">
          <div className="flex items-center gap-3 px-5 py-4">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder='Type a niche (e.g. "Recruitment", "Notion")'
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
            <LiveBadge />
          </div>
        </div>
      </form>
    </div>
  );
};
