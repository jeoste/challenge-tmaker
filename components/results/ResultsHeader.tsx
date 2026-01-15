'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResultsHeaderProps {
  niche: string;
}

export function ResultsHeader({ niche }: ResultsHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/')}
          className="hover:bg-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Top Opportunities
          </h1>
          <p className="text-sm text-muted-foreground">
            Niche: <span className="text-primary font-medium">{niche}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
