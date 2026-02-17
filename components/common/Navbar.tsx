"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { navigationPaths } from "@/lib/navigation";
import { ThemeLogo } from "@/components/theme-logo";

export default function Navbar() {
  const router = useRouter();
  return (
    <div className="fixed top-5 inset-x-0 z-50 mx-auto w-[95%] max-w-7xl">
      <nav
        className="flex items-center justify-between rounded-2xl px-6 pl-3 py-1 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.8)] ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-xl"
        style={{ backgroundColor: 'hsl(var(--navbar-bg) / 0.9)' }}
      >
        <div
          className="flex items-center gap-1 cursor-pointer"
          onClick={() => router.push('/')}
        >
          <ThemeLogo
            alt="F2Fintech Logo"
            className="w-16 h-16"
          />
          <span className="text-2xl font-bold tracking-wide cursor-pointer" style={{ color: '#3b82f6' }}>
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

        <div className="flex items-center gap-3">
          <Link href={navigationPaths.login}>
            <Button
              variant="outline"
              className="rounded-2xl px-4 py-2 font-semibold text-base border-2 hover:bg-blue-fixed/10 transition-all"
              style={{ borderColor: '#3b82f6', color: '#3b82f6' }}
            >
              Login
            </Button>
          </Link>
          <Link href={navigationPaths.signup}>
            <Button
              className="rounded-2xl px-4 py-2 font-bold text-base text-white hover:opacity-90 shadow-md transition-all"
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
