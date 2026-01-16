"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

function PricingSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get("checkout_id");
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    // Give Polar a moment to process the webhook
    // In production, you might want to poll the subscription status
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-mesh bg-grid">
      <Header />

      <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6">
        <div className="max-w-md w-full glass-card p-8 text-center">
          {loading ? (
            <>
              <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Traitement en cours...
              </h1>
              <p className="text-muted-foreground">
                Verifying your subscription
              </p>
            </>
          ) : error ? (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Erreur
              </h1>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => router.push("/dashboard")}>
                Aller au tableau de bord
              </Button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Subscription activated!
              </h1>
              <p className="text-muted-foreground mb-6">
                Your Pro subscription has been successfully activated. You can
                now enjoy all premium features.
              </p>
              {checkoutId && (
                <p className="text-xs text-muted-foreground mb-6">
                  ID de transaction: {checkoutId}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="flex-1"
                >
                  Aller au tableau de bord
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="flex-1"
                >
                  Back to home
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function PricingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-mesh bg-grid">
        <Header />
        <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6">
          <div className="max-w-md w-full glass-card p-8 text-center">
            <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Loading...
            </h1>
          </div>
        </main>
      </div>
    }>
      <PricingSuccessContent />
    </Suspense>
  );
}
