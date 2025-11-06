"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { GlassCard } from "@/components/brand/glass-card";

const terms = [
  { h: "Acceptance of Terms", p: "By accessing LendGrid, you agree to these Terms and all referenced policies." },
  { h: "Accounts & Access", p: "You are responsible for activity under your account and must keep credentials confidential." },
  { h: "Permitted Use", p: "Do not misuse the service, attempt to disrupt operations, or access data without authorization." },
  { h: "Fees & Payouts", p: "Fees and commission splits are displayed transparently within the dashboard." },
  { h: "Intellectual Property", p: "All platform IP remains the property of LendGrid and its licensors." },
  { h: "Warranties & Disclaimers", p: "Service is provided 'as is' to the fullest extent permitted by law." },
  { h: "Limitation of Liability", p: "We are not liable for indirect or consequential damages beyond the amount paid in the prior 12 months." },
  { h: "Termination", p: "We may suspend or terminate access for breach or security concerns." },
  { h: "Governing Law", p: "These Terms are governed by applicable laws of your jurisdiction unless otherwise required." },
  { h: "Changes", p: "We may update these Terms. Continued use indicates acceptance of changes." },
];

export default function TermsPage() {
  return (
    <main className="relative min-h-screen bg-gradient-to-b from-[#040d21] via-[#071227] to-[#081322] text-gray-100 antialiased pb-20">
      <section className="pt-28 text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-extrabold mb-3"
        >
          Terms of <span className="text-cyan-400">Service</span>
        </motion.h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Your agreement with LendGrid regarding access and use of the platform.
        </p>
      </section>

      <div className="mx-auto mt-10 max-w-4xl space-y-6 px-4">
        {terms.map((t, i) => (
          <GlassCard key={i} className="p-6 bg-[#081327]/40 border border-gray-800">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-cyan-300" />
              <div>
                <h3 className="text-lg font-semibold">{t.h}</h3>
                <p className="mt-2 text-sm text-gray-300">{t.p}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </main>
  );
}
