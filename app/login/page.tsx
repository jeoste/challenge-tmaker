'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { LoginForm } from '@/components/auth/LoginForm';

function LoginContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  useEffect(() => {
    if (!loading && user) {
      router.push(redirect || '/');
    }
  }, [user, loading, router, redirect]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-muted-foreground">Redirection en cours...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 backdrop-blur-sm glass-card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Connexion
            </h1>
            <p className="text-muted-foreground">
              Access Unearth
            </p>
          </div>

          <LoginForm />

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link
              href="/signup"
              className="text-primary hover:underline"
            >
              S&apos;inscrire
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
