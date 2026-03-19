"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  Users,
  ShieldCheck,
  TrendingUp,
  Mail,
} from "lucide-react";

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* BACK BUTTON */}
      {/* <button
        onClick={() => {
          if (window.history.length > 1) router.back();
          else router.push("/");
        }}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm md:text-base text-white hover:text-amber-400 font-medium transition z-20"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button> */}

      {/* HERO SECTION */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute -left-56 -top-40 w-[520px] h-[520px] bg-gradient-to-br from-[#05366b] to-[#0ea5a1] opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute right-[-120px] top-10 w-[420px] h-[420px] bg-gradient-to-tr from-[#ffb86b] to-[#ffd166] opacity-10 rounded-full blur-3xl"></div>

        <div className="max-w-6xl mx-auto px-6 md:px-10 text-center relative z-10 pt-20">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-6xl font-extrabold mb-4"
          >
            About <span className="text-cyan-400">LendGrid</span>
          </motion.h1>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl font-semibold text-gray-300 mb-6"
          >
            Empowering Aggregators & Lenders with Cutting-Edge Fintech Solutions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-3xl mx-auto text-gray-400 leading-relaxed"
          >
            LendGrid is a next-generation loan distribution infrastructure built
            to connect loan aggregators with premium lenders. We simplify
            commission tracking, automate payouts, and help financial businesses
            scale faster with real-time analytics and complete transparency.
          </motion.p>
        </div>
      </section>

      {/* OUR MISSION */}
      <section className="py-16 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
          <h3 className="text-lg font-medium text-cyan-300 mb-4">
            Simplifying digital loan distribution through technology and trust
          </h3>
          <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Our mission is to transform how financial ecosystems operate by
            making partnerships between lenders and aggregators effortless,
            transparent, and scalable. We believe in technology that enables
            growth without complexity — empowering partners to focus on what
            truly matters: building better financial access for all.
          </p>
        </div>
      </section>

      {/* OUR VISION */}
      <section className="py-16 border-t border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
          <h3 className="text-lg font-medium text-cyan-300 mb-4">
            Building the world’s most trusted loan aggregation network
          </h3>
          <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We envision a future where every financial institution, from a
            fintech startup to a leading bank, can collaborate seamlessly on one
            intelligent, compliant, and transparent platform. LendGrid is paving
            the way for that — one integration at a time.
          </p>
        </div>
      </section>

      {/* WHAT WE DO */}
      <section className="py-16 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <h2 className="text-3xl font-bold text-center mb-8">What We Do</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {[
              {
                icon: <TrendingUp className="w-10 h-10 mx-auto text-cyan-300" />,
                title: "Loan Aggregation Simplified",
                desc: "Connect with top lenders and track deals with real-time data and automated workflows.",
              },
              {
                icon: <Users className="w-10 h-10 mx-auto text-cyan-300" />,
                title: "Automation & Analytics",
                desc: "Automate commission tracking, payouts, and compliance to save time and boost profits.",
              },
              {
                icon: <ShieldCheck className="w-10 h-10 mx-auto text-cyan-300" />,
                title: "Secure & Compliant",
                desc: "Enterprise-grade encryption and RBI-aligned frameworks for complete data protection.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -6 }}
                className="p-6 rounded-2xl bg-card border border-border shadow-md"
              >
                {item.icon}
                <h4 className="mt-4 font-semibold text-lg">{item.title}</h4>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-16 border-t border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl font-bold mb-4">Why Choose LendGrid?</h2>
          <h3 className="text-lg font-medium text-cyan-300 mb-4">
            The backbone of reliable financial distribution
          </h3>
          <p className="text-muted-foreground max-w-3xl mx-auto mb-10">
            We combine deep fintech expertise, advanced analytics, and
            automation to help financial partners expand their reach, improve
            compliance, and build sustainable relationships with aggregators.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              "End-to-end automation for commissions and settlements",
              "Transparent and auditable performance tracking",
              "24/7 technical support and dedicated partner onboarding",
            ].map((text, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border"
              >
                <CheckCircle className="w-5 h-5 text-cyan-300 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section id="contact" className="py-20 border-t border-border">
        <div className="max-w-4xl mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Grow with LendGrid?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join a growing network of trusted aggregators and lenders. Scale
            your business with automation, insight, and speed.
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span>
              email us at{" "}
              <a
                className="text-cyan-300 underline"
                href="mailto:wecare@f2fintech.com"
              >
                wecare@f2fintech.com
              </a>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
