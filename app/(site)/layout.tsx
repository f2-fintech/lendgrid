import * as React from "react"
import { AuroraBackground } from "@/components/brand/aurora-background"
import Navbar from "@/components/common/Navbar"
import Footer from "@/components/common/Footer"

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* <AuroraBackground intensity={1} showParticles /> */}
      <Navbar />
      <main className="relative z-10 flex-grow pt-20">{children}</main>
      <Footer />
    </div>
  )
}
