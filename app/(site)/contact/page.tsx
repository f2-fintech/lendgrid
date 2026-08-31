"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Send,
} from "lucide-react";
import { GlassCard } from "@/components/brand/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased">
      {/* HERO SECTION */}
      <section className="relative pt-36 md:pt-40 pb-12 text-center overflow-hidden">
        <div className="absolute -left-56 -top-40 w-[520px] h-[520px] bg-gradient-to-br from-[#05366b] to-[#0ea5a1] opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute right-[-120px] top-10 w-[420px] h-[420px] bg-gradient-to-tr from-[#ffb86b] to-[#ffd166] opacity-10 rounded-full blur-3xl"></div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 px-4"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-3 tracking-tight">
            Contact <span className="text-cyan-400">LendGrid</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            We’d love to hear from you — whether you’re a lender or aggregator exploring collaboration.
          </p>
        </motion.div>
      </section>

      {/* CONTACT SECTION */}
      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-4 sm:px-6 pb-20">
        {/* CONTACT FORM */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="md:col-span-2"
        >
          <GlassCard className="p-6 sm:p-8 bg-card/80 border border-border backdrop-blur-xl shadow-xl">
            <form className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Jane Doe"
                  required
                  className="mt-2 bg-background/50 border-border focus-visible:ring-cyan-400"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  required
                  className="mt-2 bg-background/50 border-border focus-visible:ring-cyan-400"
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  name="company"
                  placeholder="Acme Corp"
                  className="mt-2 bg-background/50 border-border focus-visible:ring-cyan-400"
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  name="subject"
                  placeholder="Tell us how we can help"
                  className="mt-2 bg-background/50 border-border focus-visible:ring-cyan-400"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Write your message..."
                  required
                  rows={6}
                  className="mt-2 bg-background/50 border-border focus-visible:ring-cyan-400"
                />
              </div>

              <div className="md:col-span-2 mt-4">
                <Button
                  type="submit"
                  size="lg"
                  disabled={loading}
                  className="group relative w-full bg-cyan-500 hover:bg-cyan-600 font-semibold shadow-[0_10px_30px_-10px_rgba(6,182,212,0.5)] transition-all duration-300 text-white"
                >
                  <span className="inline-flex items-center gap-2">
                    <Send className="h-4 w-4" aria-hidden="true" />
                    {loading ? "Sending..." : "Send Message"}
                  </span>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.4),transparent)] transition-transform duration-700 ease-out group-hover:translate-x-full"
                  />
                </Button>
              </div>
            </form>
          </GlassCard>
        </motion.div>

        {/* CONTACT DETAILS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <GlassCard className="p-6 sm:p-8 bg-card/80 border border-border backdrop-blur-xl shadow-xl h-full flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold mb-6 text-foreground tracking-tight">
                Get in touch
              </h3>
              <ul className="space-y-5 text-sm text-muted-foreground">
                <li className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <a
                    href="mailto:wecare@f2fintech.com"
                    className="hover:text-cyan-400 hover:underline transition-colors font-medium text-foreground/90"
                  >
                    wecare@f2fintech.com
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0 mt-0.5">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <a
                      href="tel:+918810600135"
                      className="hover:text-cyan-400 hover:underline transition-colors font-medium text-foreground/90"
                    >
                      +91 8810600135
                    </a>
                    <a
                      href="tel:+918860600555"
                      className="hover:text-cyan-400 hover:underline transition-colors font-medium text-foreground/90"
                    >
                      +91 8860600555
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0 mt-0.5">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="text-foreground/90 font-normal leading-relaxed">
                    <p>Office 201, Second floor, C-127,</p>
                    <p>AGS Park, C Block, Sector 63,</p>
                    <p>Noida, Uttar Pradesh 201301</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-5 border-t border-border text-xs text-muted-foreground">
              <p>
                We respond to most inquiries within{" "}
                <span className="text-cyan-400 font-semibold">24 hours</span>.
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </section>
    </div>
  );
}
