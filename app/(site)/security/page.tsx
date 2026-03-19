"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Network, Bug, Activity } from "lucide-react";
import * as Accordion from "@radix-ui/react-accordion";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/brand/glass-card";

const sections = [
  { icon: <Lock className="h-5 w-5 text-cyan-300" />, h: "Encryption", p: "TLS 1.2+ in transit and AES-256 at rest for supported storage." },
  { icon: <Network className="h-5 w-5 text-cyan-300" />, h: "Network Security", p: "Firewalls, private networks, and least-privilege access for internal services." },
  { icon: <Bug className="h-5 w-5 text-cyan-300" />, h: "App Security", p: "Secure SDLC, code reviews, dependency scanning, and secret hygiene." },
  { icon: <Activity className="h-5 w-5 text-cyan-300" />, h: "Monitoring & IR", p: "Logging, alerting, and an incident response process with post-incident reviews." },
];

export default function SecurityPage() {
  return (
    <main className="relative min-h-screen bg-background text-foreground antialiased pb-20">
      <section className="pt-28 text-center px-6">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl font-extrabold mb-3">
          Security <span className="text-cyan-400">Overview</span>
        </motion.h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Security is built into our culture and infrastructure from day one — by design, not as an afterthought.
        </p>
      </section>

      <div className="mx-auto mt-10 max-w-4xl space-y-6 px-4">
        <GlassCard className="p-6 bg-card/60 border border-border">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-cyan-300" />
            <div>
              <h3 className="text-lg font-semibold">Program Overview</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Our security program covers people, process, and technology—continuously improving with risk-based prioritization.
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-0 bg-card/60 border border-border">
          <Accordion.Root type="multiple" className="w-full">
            {sections.map((s, i) => (
              <Accordion.Item key={i} value={`item-${i}`} className="border-b border-border">
                <Accordion.Header>
                  <Accordion.Trigger
                    className={cn(
                      "flex w-full items-center justify-between gap-4 p-5 text-left",
                      "data-[state=open]:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {s.icon}
                      <span className="text-base font-medium">{s.h}</span>
                    </div>
                    <span className="text-white/50">+</span>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="px-5 pb-5 text-sm text-muted-foreground">
                  {s.p}
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </GlassCard>
      </div>
    </main>
  );
}
