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
    <main className="relative min-h-screen bg-gradient-to-b from-[#040d21] via-[#071227] to-[#081322] text-gray-100 antialiased">
      {/* HERO SECTION */}
      <section className="relative pt-28 pb-12 text-center overflow-hidden">
        <div className="absolute -left-56 -top-40 w-[520px] h-[520px] bg-gradient-to-br from-[#05366b] to-[#0ea5a1] opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute right-[-120px] top-10 w-[420px] h-[420px] bg-gradient-to-tr from-[#ffb86b] to-[#ffd166] opacity-10 rounded-full blur-3xl"></div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <h1 className="text-5xl md:text-6xl font-extrabold mb-3">
            Contact <span className="text-cyan-400">LendGrid</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
            We’d love to hear from you — whether you’re a lender or aggregator exploring collaboration.
          </p>
        </motion.div>
      </section>

      {/* CONTACT SECTION */}
      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-6 pb-20">
        {/* CONTACT FORM */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="md:col-span-2"
        >
          <GlassCard className="p-8 bg-[#081327]/50 border border-gray-800 backdrop-blur-xl shadow-xl">
            <form className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Jane Doe"
                  required
                  className="mt-2 bg-white/5 border-gray-700"
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
                  className="mt-2 bg-white/5 border-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  name="company"
                  placeholder="Acme Corp"
                  className="mt-2 bg-white/5 border-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  name="subject"
                  placeholder="Tell us how we can help"
                  className="mt-2 bg-white/5 border-gray-700"
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
                  className="mt-2 bg-white/5 border-gray-700"
                />
              </div>

              <div className="md:col-span-2 mt-4">
                <Button
                  type="submit"
                  size="lg"
                  disabled={loading}
                  className="group relative w-full bg-cyan-500   font-semibold shadow-[0_10px_30px_-10px_rgba(59,130,246,0.5)] transition-all duration-300 hover:from-cyan-300 hover:via-blue-400 hover:to-amber-300"
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
          <GlassCard className="p-8 bg-[#081327]/40 border border-gray-800 backdrop-blur-md shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-white/90">
              Get in touch
            </h3>
            <ul className="space-y-4 text-sm text-gray-300">
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-cyan-300" />
                <a
                  href="mailto:wecare@f2fintech.com"
                  className="hover:underline"
                >
                  wecare@f2fintech.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-cyan-300" />
                <a href="tel:+918810600135" className="hover:underline">
                  +91-8810600135
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-cyan-300" />
                <span>A-25, M-1 Arv Park, A-Block, Sector 63, Noida</span>
              </li>
            </ul>

            <div className="mt-6 pt-4 border-t border-gray-800 text-xs text-gray-500">
              <p>
                We respond to most inquiries within{" "}
                <span className="text-cyan-300 font-medium">24 hours</span>.
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </section>
    </main>
  );
}
