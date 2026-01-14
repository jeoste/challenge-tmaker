import { Search } from "lucide-react";
import { useState } from "react";
import { LiveBadge } from "./LiveBadge";

interface SearchBarProps {
  onFocus?: () => void;
  onBlur?: () => void;
}

export const SearchBar = ({ onFocus, onBlur }: SearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    // Delay to allow clicking suggestions
    setTimeout(() => {
      setIsFocused(false);
      onBlur?.();
    }, 200);
  };

  return (
    <div className="w-full max-w-[680px] mx-auto">
      <div className="search-floating rounded-2xl">
        <div className="flex items-center gap-3 px-5 py-4">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder='Type a niche (e.g. "Recruitment", "Notion")'
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <LiveBadge />
        </div>
      </div>
    </div>
  );
};
