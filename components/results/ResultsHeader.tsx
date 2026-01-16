'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';

interface ResultsHeaderProps {
  niche: string;
}

export function ResultsHeader({ niche }: ResultsHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // Check if we came from dashboard (has analysisId in query params)
  const analysisId = searchParams.get('id');
  const fromDashboard = !!analysisId;

  const handleBack = () => {
    if (fromDashboard) {
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
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
      {user && (
        <Link href="/dashboard">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Button>
        </Link>
      )}
    </div>
  );
}
