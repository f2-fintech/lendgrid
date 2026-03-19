"use client";

import React from "react";
import { motion } from "framer-motion";
import { Scale, ShieldCheck, FileCheck, Building2 } from "lucide-react";
import { GlassCard } from "@/components/brand/glass-card";

const items = [
  { icon: <Scale className="h-5 w-5 text-cyan-300" />, title: "Regulatory Alignment", desc: "We align with finance and data regulations and adapt to evolving global standards." },
  { icon: <FileCheck className="h-5 w-5 text-cyan-300" />, title: "Policies & Controls", desc: "Access control, change management, incident response, and vendor risk management." },
  { icon: <ShieldCheck className="h-5 w-5 text-cyan-300" />, title: "Data Protection", desc: "Encryption in transit and at rest, strict RBAC, and least-privilege principles." },
  { icon: <Building2 className="h-5 w-5 text-cyan-300" />, title: "Audit Readiness", desc: "Evidence collection and continuous monitoring for simplified audits." },
];

export default function CompliancePage() {
  return (
    <main className="relative min-h-screen bg-background text-foreground antialiased pb-20">
      <section className="pt-28 text-center px-6">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl font-extrabold mb-3">
          Compliance <span className="text-cyan-400">Framework</span>
        </motion.h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Our compliance program is built on transparency, robust controls, and continuous improvement.
        </p>
      </section>

      <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-6 px-4 md:grid-cols-2">
        {items.map((card, i) => (
          <GlassCard key={i} className="p-6 bg-card/60 border border-border">
            <div className="flex items-start gap-3">
              {card.icon}
              <div>
                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{card.desc}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </main>
  );
}
