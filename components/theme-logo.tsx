"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import Image from "next/image";

interface ThemeLogoProps {
    className?: string;
    width?: number;
    height?: number;
    alt?: string;
}

export function ThemeLogo({
    className = "w-12 h-12 object-contain",
    width = 48,
    height = 48,
    alt = "F2Fintech Logo"
}: ThemeLogoProps) {
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Prevent hydration mismatch
    React.useEffect(() => {
        setMounted(true);
    }, []);

    // During SSR or before mounting, render a placeholder with the dark logo as default
    if (!mounted) {
        return (
            <img
                src="/f2fintech-logo-dark.png"
                alt={alt}
                className={className}
                width={width}
                height={height}
            />
        );
    }

    // Determine which logo to show based on the current theme
    const currentTheme = theme === "system" ? resolvedTheme : theme;
    const logoSrc = currentTheme === "light"
        ? "/f2fintech-logo-light.png"
        : "/f2fintech-logo-dark.png";

    return (
        <img
            src={logoSrc}
            alt={alt}
            className={className}
            width={width}
            height={height}
        />
    );
}
