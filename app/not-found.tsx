"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Home, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { getCookie, decodeJwt } from "@/lib/utils"
import { navigationPaths } from "@/lib/navigation"

export default function NotFound(): JSX.Element {
    const [hovering, setHovering] = React.useState(false)
    const [dashboardPath, setDashboardPath] = React.useState("/")

    React.useEffect(() => {
        const token = getCookie("lendgrid_cookie")
        if (token) {
            const decoded = decodeJwt(token)
            const role = decoded?.role

            if (role === "super_admin" || role === "SUPER_ADMIN") {
                setDashboardPath(navigationPaths.superAdmin.dashboard)
            } else if (role === "aggregator_admin" || role === "AGGREGATOR_ADMIN") {
                setDashboardPath(navigationPaths.aggregator.dashboard)
            } else if (role === "aggregator_member" || role === "AGGREGATOR_MEMBER") {
                setDashboardPath(navigationPaths.aggregatorMember.applications)
            } else if (role === "lendgrid_sales") {
                setDashboardPath(navigationPaths.lendgridSales.dashboard)
            }
        }
    }, [])

    return (
        <main
            className={cn(
                "relative min-h-screen w-full overflow-hidden",
                "bg-[#0B1220] text-white",
                "selection:bg-yellow-300/20 selection:text-yellow-200"
            )}
            aria-labelledby="not-found-title"
        >
            <RadialBackdrop />
            <AuroraOrbs />
            <Particles />

            {/* Centered glass card */}
            <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4">
                <motion.section
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 120, damping: 18 }}
                    className={cn(
                        "relative w-full overflow-hidden rounded-3xl",
                        "border border-white/10 bg-white/5 backdrop-blur-xl",
                        "shadow-[0_20px_80px_-20px_rgba(0,0,0,0.6),0_10px_30px_-10px_rgba(13,18,28,0.7)]",
                        "ring-1 ring-white/10"
                    )}
                    role="region"
                    aria-label="Page not found panel"
                >
                    {/* Moving shine */}
                    <CardShine active={hovering} />

                    <div className="relative z-10 p-8 md:p-12">
                        <div className="mb-6 flex items-center gap-2 text-yellow-300/90">
                            <Sparkles className="h-4 w-4" aria-hidden="true" />
                            <span className="text-xs font-medium tracking-wider uppercase">
                                Oops, route not found
                            </span>
                        </div>

                        <div className="mb-8 flex items-baseline gap-3">
                            {/* Animated "404" digits */}
                            <Digit text="4" delay={0} />
                            <Digit text="0" delay={0.1} />
                            <Digit text="4" delay={0.2} />
                        </div>

                        <h1 id="not-found-title" className="mb-3 text-2xl font-semibold text-white/90 md:text-3xl">
                            Page not found
                        </h1>
                        <p className="mb-8 max-w-prose text-balance text-white/60">
                            The page you’re looking for doesn’t exist or has been moved. Let’s get you back to the dashboard.
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                            <Button
                                asChild
                                size="lg"
                                className={cn(
                                    "group relative overflow-hidden",
                                    // Gradient brand button with soft glow
                                    "bg-gradient-to-r from-yellow-400 via-amber-300 to-blue-500",
                                    "text-[#0B1220] font-semibold shadow-[0_10px_30px_-10px_rgba(252,211,77,0.6),0_6px_20px_-12px_rgba(59,130,246,0.5)]",
                                    "hover:from-yellow-300 hover:via-amber-200 hover:to-blue-400",
                                    "transition-all duration-300 ease-out"
                                )}
                                onMouseEnter={() => setHovering(true)}
                                onMouseLeave={() => setHovering(false)}
                            >
                                <Link href={dashboardPath} aria-label="Go back to dashboard">
                                    <span className="relative z-10 inline-flex items-center gap-2">
                                        <Home className="h-4 w-4" aria-hidden="true" />
                                        <span>{dashboardPath === "/" ? "Go Home" : "Go to Dashboard"}</span>
                                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
                                    </span>
                                    {/* subtle overlay shimmer */}
                                    <span
                                        aria-hidden="true"
                                        className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.5),transparent)] transition-transform duration-700 ease-out group-hover:translate-x-full"
                                    />
                                </Link>
                            </Button>

                            <Link
                                href={dashboardPath}
                                className={cn(
                                    "text-sm text-white/70 underline-offset-4 hover:text-white hover:underline transition-colors"
                                )}
                            >
                                {dashboardPath === "/" ? "Return to homepage" : "Return to dashboard"}
                            </Link>
                        </div>
                    </div>
                </motion.section>
            </div>

            {/* Vignette for extra depth */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_400px_at_center,transparent,rgba(0,0,0,0.45))]"
            />
        </main>
    )
}

/* Floating aurora-like orbs in brand colors (yellow / blue) */
function AuroraOrbs() {
    return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <motion.div
                className="absolute -top-24 -left-20 h-80 w-80 rounded-full bg-yellow-400/30 blur-3xl"
                animate={{ y: [0, 10, -6, 0], x: [0, 6, -4, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-blue-500/30 blur-3xl"
                animate={{ y: [0, -12, 8, 0], x: [0, -6, 4, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(88,199,250,0.05),transparent_60%)]" />
        </div>
    )
}

/* Soft radial base gradient to avoid a flat solid background */
function RadialBackdrop() {
    return (
        <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-20%,rgba(24,34,58,0.8),rgba(11,18,32,1))]"
        />
    )
}

/* Light particle field for subtle motion */
function Particles() {
    const particles = Array.from({ length: 18 })
    return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            {particles.map((_, i) => (
                <motion.span
                    key={i}
                    className="absolute h-1.5 w-1.5 rounded-full bg-white/12 shadow-[0_0_10px_rgba(255,255,255,0.15)]"
                    style={{
                        top: `${(i * 137) % 100}%`,
                        left: `${(i * 89) % 100}%`,
                    }}
                    animate={{
                        y: [0, -8, 0],
                        opacity: [0.35, 0.7, 0.35],
                    }}
                    transition={{
                        duration: 4 + (i % 5),
                        delay: i * 0.12,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    )
}

/* Animated gradient shine across the card */
function CardShine({ active = false }: { active?: boolean }) {
    return (
        <span
            aria-hidden="true"
            className={cn(
                "pointer-events-none absolute inset-0",
                "before:absolute before:-left-1/3 before:top-0 before:h-full before:w-1/2",
                "before:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_60%)]",
                active ? "before:animate-[shine_1.2s_ease-out]" : ""
            )}
        />
    )
}

/* Animated gradient digits for 404 */
function Digit({ text, delay = 0 }: { text: string; delay?: number }) {
    return (
        <motion.span
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay, type: "spring", stiffness: 140, damping: 14 }}
            className={cn(
                "text-6xl font-extrabold tracking-tight md:text-7xl",
                "bg-clip-text text-transparent",
                "bg-gradient-to-r from-yellow-300 via-amber-200 to-blue-400 drop-shadow-[0_6px_24px_rgba(59,130,246,0.25)]"
            )}
        >
            {text}
        </motion.span>
    )
}

/* Tailwind keyframes for shine */
declare global {
    interface CSSStyleSheet { }
}
