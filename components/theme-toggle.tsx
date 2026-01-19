"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Prevent hydration mismatch
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Sun className="h-5 w-5" />
            </Button>
        )
    }

    const isDark = theme === "dark"

    const toggleTheme = () => {
        setTheme(isDark ? "light" : "dark")
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="
        relative
        text-muted-foreground
        hover:text-foreground
        hover:bg-muted
        transition-colors
      "
        >
            {/* Sun */}
            <Sun
                className={`
          h-5 w-5 absolute transition-all duration-300
          ${isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}
        `}
            />

            {/* Moon */}
            <Moon
                className={`
          h-5 w-5 absolute transition-all duration-300
          ${isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}
        `}
            />
        </Button>
    )
}
