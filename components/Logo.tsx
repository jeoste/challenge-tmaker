import { Gem } from "lucide-react";

export const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
        <div className="relative p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
          <Gem className="w-5 h-5 text-primary" />
        </div>
      </div>
      <span className="font-semibold text-lg text-foreground">
        Reddit<span className="text-primary">Goldmine</span>
      </span>
    </div>
  );
};
