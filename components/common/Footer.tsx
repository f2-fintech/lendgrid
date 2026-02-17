"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { navigationPaths } from "@/lib/navigation";
import { ThemeLogo } from "@/components/theme-logo";

export default function Footer() {
  return (
    <div className="px-6 py-10 glass-card border-border border-white/10 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-15 h-15 rounded-xl flex items-center justify-center shadow-lg">
                <ThemeLogo
                  alt="F2Fintech Logo"
                  className="w-14 h-14"
                />
              </div>
              <span className="text-2xl font-bold gradient-text text-primary">LendGrid</span>
            </div>
            <p className="text-foreground/70 leading-relaxed">
              Empowering the future of loan distribution with technology and innovation.
            </p>
          </div>

          {[
            {
              title: "Company",
              links: ["For Aggregators", "About Us", "Contact"],
            },
            {
              title: "Legal",
              links: ["Privacy Policy", "Terms of Service", "Compliance", "Security"],
            },
          ].map((section, index) => (
            <div key={index}>
              <h4 className="font-semibold mb-4 text-foreground text-lg">{section.title}</h4>
              <ul className="space-y-3 text-gray-400">
                {section.links.map((link, linkIndex) => {
                  // Special handling for platform role links
                  if (link === 'For Aggregators' || link === 'For Lenders') {
                    const roleKey = link === 'For Aggregators' ? 'aggregator' : 'lender'
                    // Directly navigate to login with role query param
                    return (
                      <li key={linkIndex}>
                        <Link
                          href={`${navigationPaths.login}?role=${roleKey === 'aggregator' ? 'aggregator_admin' : 'lender_admin'}`}
                          className="text-lg text-foreground/70 hover:text-primary hover:underline cursor-pointer transition-colors duration-300"
                        >
                          {link}
                        </Link>
                      </li>
                    )
                  }

                  const path =
                    `/` +
                    link
                      .toLowerCase()
                      .replace(/\s+/g, "-") // Replace spaces with hyphens
                      .replace(/[^a-z-]/g, "") // Remove special characters

                  return (
                    <li key={linkIndex}>
                      <Link href={path}>
                        <span className="text-lg text-foreground/70 hover:text-primary hover:underline cursor-pointer transition-colors duration-300">
                          {link}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-border/10 pt-8 text-center text-foreground">
          <p>&copy; 2025 LendGrid. All rights reserved. Built for the future of financial services.</p>
        </div>
      </div>
    </div>
  )
}