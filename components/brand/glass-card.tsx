"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import * as React from "react"

type GlassCardProps = {
    className?: string
    children?: React.ReactNode
    as?: "section" | "div" | "article"
    hoverShine?: boolean
}

export function GlassCard({
    className,
    children,
    as = "section",
    hoverShine = true,
}: GlassCardProps) {
    const Comp = motion[as as "div"]

    const [hover, setHover] = React.useState(false)

    return (
        <Comp
            onHoverStart={hoverShine ? () => setHover(true) : undefined}
            onHoverEnd={hoverShine ? () => setHover(false) : undefined}
            initial={{ y: 16, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            className={cn(
                "relative overflow-hidden rounded-3xl",
                "border border-border bg-card/60 backdrop-blur-xl",
                "shadow-[0_8px_30px_-8px_rgba(0,0,0,0.3)]",
                "ring-1 ring-border/50",
                className
            )}
        >
            {/* subtle moving shine on hover */}
            <span
                aria-hidden="true"
                className={cn(
                    "pointer-events-none absolute inset-0 transition-transform duration-700 ease-out",
                    hover ? "translate-x-0" : "-translate-x-full",
                    "bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.12),transparent)]"
                )}
            />
            <div className="relative z-10">{children}</div>
        </Comp>
    )
}
