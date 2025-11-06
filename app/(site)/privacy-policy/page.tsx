"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { GlassCard } from "@/components/brand/glass-card";

const sections = [
  {
    title: "Information We Collect",
    content:
      "We collect account details, usage analytics, and technical telemetry to operate and improve the platform. You can request export or deletion of your data subject to legal requirements.",
  },
  {
    title: "How We Use Information",
    content:
      "To authenticate users, provide services, process payouts, prevent fraud, and inform product decisions in aggregate. We do not sell personal data.",
  },
  {
    title: "Cookies & Tracking",
    content:
      "We use cookies and similar technologies for authentication, preferences, and performance insights. You can control cookies via your browser settings.",
  },
  {
    title: "Data Retention",
    content:
      "We retain information for as long as needed to provide the service and comply with legal obligations. Backups are rotated on a rolling basis.",
  },
  {
    title: "Your Rights",
    content:
      "Access, correction, deletion, and portability where applicable. Contact us to exercise your rights and we’ll respond within a reasonable timeframe.",
  },
  {
    title: "Contact",
    content: "For privacy inquiries, reach us at privacy@lendgrid.com.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen bg-gradient-to-b from-[#040d21] via-[#071227] to-[#081322] text-gray-100 antialiased pb-20">
      {/* Hero Section */}
      <section className="pt-28 text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-extrabold mb-3"
        >
          Privacy <span className="text-cyan-400">Policy</span>
        </motion.h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          How we collect, use, and protect your information while keeping
          transparency at our core.
        </p>
      </section>

      {/* Sections */}
      <div className="mx-auto mt-10 max-w-4xl space-y-6 px-4">
        {sections.map((s, i) => (
          <GlassCard key={i} className="p-6 bg-[#081327]/40 border border-gray-800">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-cyan-300" />
              <div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-300">{s.content}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </main>
  );
}
