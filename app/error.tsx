'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="glass-card p-8 text-center">
          {/* Error Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-destructive/20 blur-xl" />
              <div className="relative w-16 h-16 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
            </div>
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-foreground mb-3">
            An error occurred
          </h1>

          {/* Error Message */}
          <p className="text-muted-foreground mb-2">
            {error.message || 'An unexpected error occurred.'}
          </p>

          {error.digest && (
            <p className="text-xs text-muted-foreground mb-6 font-mono">
              Code: {error.digest}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={reset}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              asChild
            >
              <Link href="/">
                Back to Home
              </Link>
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-muted-foreground mt-6">
            If the problem persists, please try again in a few moments.
          </p>
        </div>
      </div>
    </div>
  );
}
