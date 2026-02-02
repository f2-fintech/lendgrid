"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { navigationPaths } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/brand/glass-card";


export default function Footer() {
  return (
    <div className="px-6 py-10 glass-card border-t border-white/10 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient rounded-xl flex items-center justify-center shadow-lg">
                <img
                  src="/f2Fintechlogo.png"
                  alt="F2Fintech Logo"
                  className="w-12 h-12 rounded-xl"
                />
              </div>
              <span className="text-2xl font-bold gradient-text text-primary">LendGrid</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Empowering the future of loan distribution with technology and innovation.
            </p>
          </div>

          {[
            {
              title: "Platform",
              links: ["For Aggregators", "For Lenders"],
            },
            {
              title: "Company",
              links: ["About Us", "Contact"],
            },
            {
              title: "Legal",
              links: ["Privacy Policy", "Terms of Service", "Compliance", "Security"],
            },
          ].map((section, index) => (
            <div key={index}>
              <h4 className="font-semibold mb-4 text-white text-lg">{section.title}</h4>
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
                          className="hover:text-gold transition-colors duration-300 hover:underline cursor-pointer"
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
                        <span className="hover:text-gold transition-colors duration-300 hover:underline cursor-pointer">
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

        <div className="border-t border-white/10 pt-8 text-center text-gray-400">
          <p>&copy; 2025 LendGrid. All rights reserved. Built for the future of financial services.</p>
        </div>
      </div>
    </div>
  )
}