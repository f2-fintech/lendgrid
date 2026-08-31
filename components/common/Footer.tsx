"use client";

import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { navigationPaths } from "@/lib/navigation";
import { ThemeLogo } from "@/components/theme-logo";

export default function Footer() {
  return (
    <footer className="px-6 py-12 glass-card border-t border-white/10 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row flex-wrap justify-between items-start gap-8 lg:gap-12 mb-10">
          {/* Brand & Address / Contact */}
          <div className="max-w-xs">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg">
                <ThemeLogo
                  alt="F2Fintech Logo"
                  className="w-10 h-10"
                />
              </div>
              <span className="text-xl md:text-2xl font-bold gradient-text text-primary">LendGrid</span>
            </div>
            <p className="text-foreground/70 leading-relaxed text-sm mb-4">
              Empowering the future of financial technology with innovation.
            </p>
            <div className="space-y-2.5 text-xs md:text-sm text-foreground/70">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="leading-snug">
                  Office 201, Second floor, C-127, AGS Park, C Block, Sector 63, Noida, Uttar Pradesh 201301
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <div className="flex flex-wrap gap-x-1">
                  <a href="tel:+918810600135" className="hover:text-primary hover:underline transition-colors font-medium">
                    +91 8810600135
                  </a>
                  <span>,</span>
                  <a href="tel:+918860600555" className="hover:text-primary hover:underline transition-colors font-medium">
                    +91 8860600555
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground text-lg">Company</h4>
            <ul className="space-y-3 text-gray-400">
              {["For Aggregators", "About Us", "Contact"].map((link, linkIndex) => {
                if (link === 'For Aggregators') {
                  return (
                    <li key={linkIndex}>
                      <Link
                        href={`${navigationPaths.login}?role=aggregator_admin`}
                        className="text-base text-foreground/70 hover:text-primary hover:underline cursor-pointer transition-colors duration-300"
                      >
                        {link}
                      </Link>
                    </li>
                  )
                }
                const path = `/` + link.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z-]/g, "");
                return (
                  <li key={linkIndex}>
                    <Link href={path}>
                      <span className="text-base text-foreground/70 hover:text-primary hover:underline cursor-pointer transition-colors duration-300">
                        {link}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground text-lg">Legal</h4>
            <ul className="space-y-3 text-gray-400">
              {["Privacy Policy", "Terms of Service", "Compliance", "Security"].map((link, linkIndex) => {
                const path = `/` + link.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z-]/g, "");
                return (
                  <li key={linkIndex}>
                    <Link href={path}>
                      <span className="text-base text-foreground/70 hover:text-primary hover:underline cursor-pointer transition-colors duration-300">
                        {link}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* D&B Registered & Social Links */}
          <div className="flex flex-col items-start min-w-[160px]">
            <a
              href="https://dunsregistered.dnb.com/DunsRegisteredProfileAnywhere.aspx?Key1=3201911&PaArea=Email"
              target="_blank"
              rel="noopener noreferrer"
              className="relative block w-36 sm:w-40 transition-transform duration-300 hover:scale-105 mb-5 cursor-pointer"
            >
              <img
                src="/QRlogo-123.webp"
                alt="D&B Registered"
                className="w-full bg-white rounded-lg p-2 shadow-md block"
              />
              <div
                className="absolute bottom-[10%] left-[8%] w-[84%] h-[28%] bg-[#004a77] text-white flex items-center justify-center rounded text-xs font-bold pointer-events-none transition-opacity duration-500"
                style={{
                  animation: "dunsBlink 2.5s infinite ease-in-out",
                }}
              >
                Click Here
              </div>
            </a>

            <div>
              <h4 className="font-semibold mb-3 text-foreground text-lg">Let's Connect</h4>
              <div className="flex items-center gap-4 text-foreground/80">
                <a
                  href="https://www.facebook.com/f2fintech/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="hover:text-primary transition-colors"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a
                  href="https://www.youtube.com/channel/UCMyV4yKd27_Vx3Sq2FSDN5A"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="hover:text-primary transition-colors"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
                <a
                  href="https://www.instagram.com/f2fintech_official?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw=="
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="hover:text-primary transition-colors"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a
                  href="https://www.linkedin.com/company/f2fintech"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="hover:text-primary transition-colors"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/10 pt-8 text-center text-foreground">
          <p>&copy; 2025 LendGrid. All rights reserved. Built for the future of financial services.</p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes dunsBlink {
          0%, 45% {
            opacity: 0;
          }
          50%, 95% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </footer>
  );
}

