"use client";

import { useState, useEffect } from "react";

export const LiveBadge = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          setCount(data.postsScanned24h || 0);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 glass-card rounded-full">
        <div className="relative flex items-center justify-center">
          <span className="live-pulse absolute w-2 h-2 rounded-full bg-primary" />
          <span className="relative w-2 h-2 rounded-full bg-primary" />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          Loading...
        </span>
      </div>
    );
  }

  const displayCount = count >= 1000 
    ? `${(count / 1000).toFixed(1)}k`
    : count.toString();

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 glass-card rounded-full">
      <div className="relative flex items-center justify-center">
        <span className="live-pulse absolute w-2 h-2 rounded-full bg-primary" />
        <span className="relative w-2 h-2 rounded-full bg-primary" />
      </div>
      <span className="text-xs font-medium text-muted-foreground">
        Live: <span className="text-foreground font-semibold">{displayCount}</span> posts scanned 24h
      </span>
    </div>
  );
};
