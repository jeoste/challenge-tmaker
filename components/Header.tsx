"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { useAuth } from "./auth/AuthProvider";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { User, LogOut, Settings, LayoutDashboard, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
}

const navItems: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
];

export const Header = () => {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  // Update active index based on pathname
  useEffect(() => {
    const index = navItems.findIndex(
      (item) => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
    );
    if (index >= 0) {
      setActiveIndex(index);
    } else if (user && (pathname === "/dashboard" || pathname.startsWith("/dashboard"))) {
      setActiveIndex(navItems.length);
    } else {
      setActiveIndex(null);
    }
  }, [pathname, user]);

  // Animate ghost element
  useEffect(() => {
    const ghost = ghostRef.current;
    if (!ghost) return;

    if (activeIndex === null) {
      ghost.style.opacity = '0';
      return;
    }

    const targetHref = activeIndex < navItems.length 
      ? navItems[activeIndex].href 
      : '/dashboard';
    const link = linkRefs.current.get(targetHref);
    if (!link) {
      ghost.style.opacity = '0';
      return;
    }

    const nav = navRef.current;
    if (!nav) return;

    const updateGhostPosition = () => {
      const navRect = nav.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      const left = linkRect.left - navRect.left;
      const width = linkRect.width;

      ghost.style.transform = `translateX(${left}px) scaleX(${width / 100})`;
      ghost.style.opacity = '1';
    };

    // Initial position
    updateGhostPosition();

    // Use Web Animations API for smooth transition
    const currentLeft = ghost.style.transform.match(/translateX\(([^)]+)\)/)?.[1] || '0px';
    const currentScale = ghost.style.transform.match(/scaleX\(([^)]+)\)/)?.[1] || '1';
    
    const navRect = nav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const targetLeft = linkRect.left - navRect.left;
    const targetWidth = linkRect.width;
    const targetScale = targetWidth / 100;

    // Only animate if there's a change
    if (currentLeft !== `${targetLeft}px` || currentScale !== String(targetScale)) {
      const animation = ghost.animate(
        [
          {
            transform: `translateX(${currentLeft}) scaleX(${currentScale})`,
            opacity: ghost.style.opacity || '0',
          },
          {
            transform: `translateX(${targetLeft}px) scaleX(${targetScale})`,
            opacity: '1',
          },
        ],
        {
          duration: 400,
          easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          fill: 'forwards',
        }
      );

      animation.onfinish = () => {
        updateGhostPosition();
      };
    } else {
      updateGhostPosition();
    }

    // Handle window resize
    const handleResize = () => {
      updateGhostPosition();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeIndex]);

  const handleLinkMouseEnter = (index: number) => {
    setActiveIndex(index);
  };

  const handleLinkMouseLeave = () => {
    // Keep active index if it matches pathname
    const index = navItems.findIndex(
      (item) => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
    );
    if (index >= 0) {
      setActiveIndex(index);
    } else if (user && (pathname === "/dashboard" || pathname.startsWith("/dashboard"))) {
      setActiveIndex(navItems.length);
    } else {
      setActiveIndex(null);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Layered shadows for depth with top highlight border */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background/80 backdrop-blur-xl"
        style={{
          borderTop: '1px solid hsl(210 40% 98% / 0.08)',
          borderBottom: '1px solid hsl(var(--border))',
          boxShadow: `
            0 1px 0 0 hsl(210 40% 98% / 0.06),
            0 4px 12px -2px hsl(222 47% 6% / 0.8),
            0 8px 24px -4px hsl(222 47% 6% / 0.6)
          `,
        }}
      />
      
      <div className="relative mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <Link 
            href="/" 
            className="hover:opacity-80 transition-opacity"
            style={{
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Logo />
          </Link>
          
          <nav 
            ref={navRef}
            className="hidden md:flex items-center gap-6 relative"
            style={{ height: '32px' }}
          >
            {/* Ghost element - liquid magnet effect */}
            <div
              ref={ghostRef}
              className="absolute left-0 top-0 h-full rounded-lg pointer-events-none"
              style={{
                width: '100px',
                background: 'linear-gradient(to bottom, hsl(222 30% 16% / 0.5), hsl(222 30% 14% / 0.4))',
                border: '1px solid hsl(222 30% 20% / 0.4)',
                borderTop: '1px solid hsl(210 40% 98% / 0.08)',
                boxShadow: `
                  0 1px 0 0 hsl(210 40% 98% / 0.06),
                  0 2px 8px -2px hsl(222 47% 6% / 0.5),
                  0 4px 16px -4px hsl(222 47% 6% / 0.3),
                  inset 0 1px 0 0 hsl(210 40% 98% / 0.02)
                `,
                opacity: 0,
                transform: 'translateX(0px) scaleX(1)',
                transformOrigin: 'left center',
                transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
            
            {navItems.map((item, index) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  ref={(el) => {
                    if (el) linkRefs.current.set(item.href, el);
                  }}
                  onMouseEnter={() => handleLinkMouseEnter(index)}
                  onMouseLeave={handleLinkMouseLeave}
                  className={cn(
                    "relative text-sm font-medium transition-colors px-3 py-1.5 rounded-lg",
                    "z-10",
                    isActive
                      ? "text-foreground"
                      : "text-[hsl(210_40%_60%)] hover:text-[hsl(210_40%_75%)]"
                  )}
                  style={{
                    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                    transitionDuration: '200ms',
                    lineHeight: '1.2',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
            
            {user && (
              <Link
                href="/dashboard"
                ref={(el) => {
                  if (el) linkRefs.current.set('/dashboard', el);
                }}
                onMouseEnter={() => {
                  const dashboardIndex = navItems.length;
                  setActiveIndex(dashboardIndex);
                }}
                onMouseLeave={handleLinkMouseLeave}
                className={cn(
                  "relative text-sm font-medium transition-colors px-3 py-1.5 rounded-lg",
                  "z-10",
                  pathname === "/dashboard" || pathname.startsWith("/dashboard")
                    ? "text-foreground"
                    : "text-[hsl(210_40%_60%)] hover:text-[hsl(210_40%_75%)]"
                )}
                style={{
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                  transitionDuration: '200ms',
                  lineHeight: '1.2',
                  letterSpacing: '-0.01em',
                }}
              >
                Dashboard
              </Link>
            )}
          </nav>
          
          <div className="flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 hover:bg-[hsl(222_30%_14%)] transition-colors"
                        style={{
                          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        <Badge 
                          variant="outline" 
                          className="flex items-center gap-1.5 px-2 py-1 border-[hsl(var(--border))]"
                        >
                          <User className="h-3 w-3" />
                        </Badge>
                        <span 
                          className="text-sm text-foreground hidden sm:inline font-medium"
                          style={{
                            lineHeight: '1.4',
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {user.email}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-56 glass-card"
                      style={{
                        boxShadow: `
                          0 1px 0 0 hsl(210 40% 98% / 0.05),
                          0 4px 16px -2px hsl(222 47% 6% / 0.8),
                          0 8px 32px -4px hsl(222 47% 6% / 0.6)
                        `,
                      }}
                    >
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p 
                            className="text-sm font-semibold leading-tight text-foreground"
                            style={{ lineHeight: '1.3' }}
                          >
                            My account
                          </p>
                          <p 
                            className="text-xs leading-tight text-[hsl(210_40%_60%)]"
                            style={{ lineHeight: '1.4' }}
                          >
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a 
                          href="https://insigh.to/b/unearth" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Feedback
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Link href="/signup">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hidden sm:inline-flex text-[hsl(210_40%_60%)] hover:text-foreground hover:bg-[hsl(222_30%_14%)]"
                        style={{
                          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                          fontWeight: '500',
                        }}
                      >
                        Sign up
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      onClick={() => router.push('/login')}
                      className="font-medium"
                      style={{
                        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: `
                          0 1px 0 0 hsl(210 40% 98% / 0.1),
                          0 2px 8px -2px hsl(30 100% 50% / 0.2),
                          0 4px 16px -4px hsl(30 100% 50% / 0.1)
                        `,
                      }}
                    >
                      Sign in
                    </Button>
                  </>
                )}
          </div>
        </div>
      </div>
    </header>
  );
};
