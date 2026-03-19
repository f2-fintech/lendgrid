"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { navigationPaths } from "@/lib/navigation";
import { ThemeLogo } from "@/components/theme-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Navbar() {
  const router = useRouter();
  return (
    <div className="fixed top-2 md:top-5 inset-x-0 z-50 mx-auto w-[98%] md:w-[95%] max-w-7xl">
      <nav
        className="flex items-center justify-between rounded-2xl px-2 sm:px-4 md:px-6 py-1 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.8)] ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-xl"
        style={{ backgroundColor: 'hsl(var(--navbar-bg) / 0.9)' }}
      >
        <div
          className="flex items-center gap-1 md:gap-2 cursor-pointer"
          onClick={() => router.push('/')}
        >
          <ThemeLogo
            alt="F2Fintech Logo"
            className="w-8 h-8 md:w-16 md:h-16 shrink-0"
          />
          <span className="text-lg md:text-2xl font-bold tracking-wide cursor-pointer" style={{ color: '#3b82f6' }}>
            LendGrid
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {["Features", "Solution", "Testimonials", "Contact"].map((item) => (
            <Link
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-lg font-semibold text-foreground/90 hover:text-primary transition-colors"
            >
              {item}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1.5 md:gap-3">
          <ThemeToggle />
          <Link href={navigationPaths.login}>
            <Button
              variant="outline"
              className="rounded-2xl px-3 md:px-4 py-1.5 md:py-2 flex items-center justify-center font-semibold text-xs md:text-base border-2 hover:bg-blue-fixed/10 transition-all h-auto"
              style={{ borderColor: '#3b82f6', color: '#3b82f6' }}
            >
              Login
            </Button>
          </Link>
          <Link href={navigationPaths.signup}>
            <Button
              className="rounded-2xl px-3 md:px-4 py-1.5 md:py-2 flex items-center justify-center font-bold text-xs md:text-base text-white hover:opacity-90 shadow-md transition-all h-auto"
              style={{ backgroundColor: '#3b82f6' }}
            >
              Sign Up
            </Button>
          </Link>
        </div>
      </nav>
    </div>
  );
}
