"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "./Logo";
import { useAuth } from "./auth/AuthProvider";
import { Button } from "./ui/button";

export const Header = () => {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Explore
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Trends
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              API
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <>
                    <span className="text-sm text-muted-foreground hidden sm:inline">
                      {user.email}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSignOut}
                    >
                      Déconnexion
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => router.push('/login')}
                  >
                    Se connecter
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
