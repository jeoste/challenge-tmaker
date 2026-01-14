import { useState, useEffect } from "react";

export const LiveBadge = () => {
  const [count, setCount] = useState(12847);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => prev + Math.floor(Math.random() * 5) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 glass-card rounded-full">
      <div className="relative flex items-center justify-center">
        <span className="live-pulse absolute w-2 h-2 rounded-full bg-primary" />
        <span className="relative w-2 h-2 rounded-full bg-primary" />
      </div>
      <span className="text-xs font-medium text-muted-foreground">
        Live: <span className="text-foreground font-semibold">{(count / 1000).toFixed(1)}k</span> posts scanned 24h
      </span>
    </div>
  );
};
