'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        toast.error(error.message || 'Erreur lors de l\'inscription');
        return;
      }

      // Afficher un message indiquant qu'un email de confirmation a été envoyé
      toast.success(
        'Inscription réussie ! Un email de confirmation a été envoyé. Veuillez valider votre adresse email avant de vous connecter.',
        { duration: 8000 }
      );
      
      // Rediriger vers la page de login après un court délai
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-card border-border backdrop-blur-sm focus:border-primary focus:ring-primary/20"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="bg-card border-border backdrop-blur-sm focus:border-primary focus:ring-primary/20"
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">
          Minimum 6 caractères
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          className="bg-card border-border backdrop-blur-sm focus:border-primary focus:ring-primary/20"
          disabled={loading}
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-primary text-primary-foreground hover:opacity-90 transition-all"
        disabled={loading}
      >
        {loading ? 'Inscription...' : 'S\'inscrire'}
      </Button>
    </form>
  );
}
