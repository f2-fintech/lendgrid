"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: string | HTMLElement, opts: any) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
    ReactNativeWebView?: {
      postMessage: (msg: string) => void;
    };
  }
}

export default function TurnstileMobilePage() {
  const [loaded, setLoaded] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const themeParam = params.get("theme");
      if (themeParam === "dark") {
        setTheme("dark");
      } else {
        setTheme("light");
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Force transparent backgrounds to support blending into the mobile app's theme
      document.body.style.setProperty("background-color", "transparent", "important");
      document.documentElement.style.setProperty("background-color", "transparent", "important");

      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme]);

  useEffect(() => {
    if (!loaded || !window.turnstile || widgetId.current) return;

    const el = document.getElementById("turnstile-mobile");
    if (!el) return;

    try {
      widgetId.current = window.turnstile.render(el, {
        sitekey: process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_KEY,
        theme: theme, // Dynamically sets theme to "light" or "dark"
        callback: (token: string) => {
          // send token to mobile webview
          window.ReactNativeWebView?.postMessage(
            JSON.stringify({ type: "lendgrid_cookie", token }),
          );
        },
        "expired-callback": () => {
          window.ReactNativeWebView?.postMessage(
            JSON.stringify({ type: "lendgrid_cookie", token: null }),
          );
        },
        "error-callback": () => {
          window.ReactNativeWebView?.postMessage(
            JSON.stringify({ type: "lendgrid_cookie", token: null }),
          );
        },
      });
    } catch {
      window.ReactNativeWebView?.postMessage(
        JSON.stringify({ type: "lendgrid_cookie", token: null }),
      );
    }

    return () => {
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {}
        widgetId.current = null;
      }
    };
  }, [loaded, theme]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "transparent", // ◄ Transparent so mobile app's background shows through
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 10,
        padding: 16,
      }}
    >
      {/* optional */}
      <meta name="robots" content="noindex, nofollow" />

      <div id="turnstile-mobile" />
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
