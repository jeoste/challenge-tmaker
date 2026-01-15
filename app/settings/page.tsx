'use client';

import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/settings');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh bg-grid">
        <Header />
        <div className="pt-24 px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="h-9 w-48 bg-secondary/50 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-mesh bg-grid">
      <Header />
      <div className="pt-24 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/dashboard">
              <Button variant="outline" className="flex items-center gap-2 mb-4">
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">
              Settings
            </h1>
            <p className="text-muted-foreground text-lg">
              Gérez vos paramètres de compte
            </p>
          </div>

          <Card className="glass-card p-6">
            <CardHeader>
              <CardTitle>Compte</CardTitle>
              <CardDescription>
                Informations sur votre compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <p className="text-foreground mt-1">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card p-6 mt-6">
            <CardHeader>
              <CardTitle>À venir</CardTitle>
              <CardDescription>
                Fonctionnalités en développement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Les paramètres avancés seront disponibles prochainement.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
