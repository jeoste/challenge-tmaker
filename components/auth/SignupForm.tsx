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
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must contain at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Get the current origin (works in both dev and production)
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/login`
        : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        toast.error(error.message || 'Error during registration');
        return;
      }

      // Display a message indicating that a confirmation email has been sent
      toast.success(
        'Registration successful! A confirmation email has been sent. Please validate your email address before logging in.',
        { duration: 8000 }
      );
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch {
      toast.error('An error occurred');
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
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-card border-border backdrop-blur-sm focus:border-primary focus:ring-primary/20"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
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
          Minimum 6 characters
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
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
        {loading ? 'Signing up...' : 'Sign Up'}
      </Button>
    </form>
  );
}
