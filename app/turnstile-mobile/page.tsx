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
    const widgetId = useRef<string | null>(null);

    useEffect(() => {
        if (!loaded || !window.turnstile || widgetId.current) return;

        const el = document.getElementById("turnstile-mobile");
        if (!el) return;

        try {
            widgetId.current = window.turnstile.render(el, {
                sitekey: process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_KEY,
                theme: "dark",
                callback: (token: string) => {
                    // send token to mobile webview
                    window.ReactNativeWebView?.postMessage(
                        JSON.stringify({ type: "token", token })
                    );
                },
                "expired-callback": () => {
                    window.ReactNativeWebView?.postMessage(
                        JSON.stringify({ type: "token", token: null })
                    );
                },
                "error-callback": () => {
                    window.ReactNativeWebView?.postMessage(
                        JSON.stringify({ type: "token", token: null })
                    );
                },
            });
        } catch {
            window.ReactNativeWebView?.postMessage(
                JSON.stringify({ type: "token", token: null })
            );
        }

        return () => {
            if (widgetId.current && window.turnstile) {
                try {
                    window.turnstile.remove(widgetId.current);
                } catch { }
                widgetId.current = null;
            }
        };
    }, [loaded]);

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#0c0c0c",
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
            <p style={{ color: "#aaa", fontSize: 12, margin: 0 }}>
                Please complete verification
            </p>

            <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js"
                strategy="afterInteractive"
                onLoad={() => setLoaded(true)}
            />
        </div>
    );
}
