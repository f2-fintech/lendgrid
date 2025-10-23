"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowRight,
  TrendingUp,
  Shield,
  Zap,
  Users,
  BarChart3,
  CreditCard,
  Star,
  Building2,
  Percent,
  Plus,
  Minus,
  Divide,
  X,
  Calculator,
  DollarSign,
} from "lucide-react"
import { useForm } from "react-hook-form"
import Link from "next/link"
import Image from "next/image"
import { navigationPaths } from "@/lib/navigation"
import { lenderNames, LendersCarousel } from "@/components/ui/carousel-lenders"

const testimonials = [
  {
    name: "Rajesh Kumar",
    company: "F2 Fintech",
    role: "CEO",
    image: "/placeholder.svg?height=60&width=60&text=RK",
    review: "LendGrid transformed our loan distribution process. 40% increase in commissions within 3 months!",
  },
  {
    name: "Priya Sharma",
    company: "LoanKart Partners",
    role: "Head of Operations",
    image: "/placeholder.svg?height=60&width=60&text=PS",
    review: "Seamless integration with multiple lenders. The automated payout tracking is a game-changer.",
  },
  {
    name: "Amit Patel",
    company: "QuickLoan DSA",
    role: "Founder",
    image: "/placeholder.svg?height=60&width=60&text=AP",
    review: "Best platform for DSAs. Real-time commission tracking and instant notifications keep us ahead.",
  },
]

const FloatingMathSymbols = () => {
  const symbols = [
    { icon: Percent, delay: 0, size: "text-4xl", position: { top: "10%", left: "10%" } },
    { icon: Plus, delay: 0.5, size: "text-3xl", position: { top: "20%", right: "15%" } },
    { icon: Minus, delay: 1, size: "text-5xl", position: { top: "60%", left: "5%" } },
    { icon: Divide, delay: 1.5, size: "text-3xl", position: { top: "40%", right: "10%" } },
    { icon: X, delay: 2, size: "text-4xl", position: { top: "80%", left: "20%" } },
    { icon: Calculator, delay: 2.5, size: "text-6xl", position: { top: "30%", left: "80%" } },
    { icon: DollarSign, delay: 3, size: "text-5xl", position: { top: "70%", right: "25%" } },
    { icon: Percent, delay: 3.5, size: "text-3xl", position: { top: "15%", left: "60%" } },
    { icon: Plus, delay: 4, size: "text-4xl", position: { top: "85%", right: "5%" } },
    { icon: TrendingUp, delay: 4.5, size: "text-5xl", position: { top: "50%", left: "40%" } },
    { icon: Percent, delay: 5, size: "text-2xl", position: { top: "25%", left: "30%" } },
    { icon: Plus, delay: 5.5, size: "text-6xl", position: { top: "45%", right: "30%" } },
    { icon: Minus, delay: 6, size: "text-3xl", position: { top: "35%", left: "70%" } },
    { icon: X, delay: 6.5, size: "text-4xl", position: { top: "75%", right: "40%" } },
    { icon: Calculator, delay: 7, size: "text-2xl", position: { top: "55%", left: "15%" } },
    { icon: DollarSign, delay: 7.5, size: "text-7xl", position: { top: "90%", left: "50%" } },
    { icon: Divide, delay: 8, size: "text-3xl", position: { top: "5%", right: "35%" } },
    { icon: TrendingUp, delay: 8.5, size: "text-4xl", position: { top: "65%", left: "85%" } },
  ]

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1]">
      {symbols.map((Symbol, index) => (
        <motion.div
          key={index}
          className={`absolute ${Symbol.size}`}
          style={{
            ...Symbol.position,
            color: "rgba(255, 215, 0, 0.6)",
            filter: "drop-shadow(0 0 12px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 24px rgba(255, 215, 0, 0.4))",
          }}
          initial={{ opacity: 0, y: 100, rotate: 0, scale: 0.5 }}
          animate={{
            opacity: [0, 0.8, 0.4, 0.9, 0.3, 0.7],
            y: [-100, -200, -300, -400, -500, -600],
            x: [0, Math.random() * 120 - 60, Math.random() * 180 - 90, Math.random() * 100 - 50],
            rotate: [0, 180, 360, 540, 720, 900],
            scale: [0.5, 1.2, 0.8, 1.5, 0.6, 1],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            delay: Symbol.delay,
            ease: "easeInOut",
          }}
        >
          <Symbol.icon />
        </motion.div>
      ))}
    </div>
  )
}

export function LandingPage() {
  const [currentLender, setCurrentLender] = useState(0)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLender((prev) => (prev + 1) % lenderNames.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const onSubmit = (data: any) => {
    console.log("Form submitted:", data)
    // Handle form submission
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white relative overflow-hidden">
      <FloatingMathSymbols />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4 backdrop-blur-lg bg-opacity-50  border-white/10 ">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-12 h-10 bg-gradient  rounded-xl flex items-center justify-center shadow-lg">
              <img
                src="/logo.png" // Replace with your logo path
                alt="LendGrid Logo"
                className="w-12 h-10 rounded-xl "
              />
            </div>
            <span className="text-2xl font-bold gradient-text text-gold">LendGrid</span>
          </motion.div>
          <div className="hidden md:flex items-center space-x-8">
            {["Features", "Lenders", "Testimonials", "Contact"].map((item, index) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-gray-300 hover:text-gold transition-colors duration-300 font-medium"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                {item}
              </motion.a>
            ))}
          </div>

          <motion.div
            className="flex items-center space-x-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href={navigationPaths.login}>
              <Button className="glass-button bg-gradient-to-r from-blue to-cyan-500 text-white hover:text-gold">Login</Button>
            </Link>
            <Link href={navigationPaths.signup}>
              <Button className="btn-primary bg-gradient-to-r from-blue to-cyan-500 hover:text-gold">Sign Up</Button>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20 text-center z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 gradient-text leading-tight">
              Grow your Loan Distribution.
              <br />
              <span className="text-4xl md:text-6xl">Track, Earn, Repeat.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Connect loan aggregators with premium lenders. Automate commission tracking, streamline payouts, and scale
              your financial services business with cutting-edge technology.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
          >
            <Link href={navigationPaths.login}>
              <Button className="btn-primary px-8 py-4 text-lg rounded-xl bg-gradient-to-r from-blue to-cyan-500 shadow-2xl  hover:text-gold">
                Join as Loan Aggregator
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button className="btn-secondary px-8 py-4 text-lg rounded-xl bg-gradient-to-r from-blue to-cyan-500 hover:text-gold">
              List Your Landing Products
              <Building2 className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>

          {/* Commission Logic Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="enhanced-card p-8 max-w-3xl mx-auto relative overflow-hidden"
          >
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-gold/30 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                />
              ))}
            </div>

            <motion.h3
              className="text-2xl font-semibold mb-6 text-gold relative z-10"
              animate={{
                textShadow: [
                  "0 0 10px rgba(255, 215, 0, 0.5)",
                  "0 0 20px rgba(255, 215, 0, 0.8)",
                  "0 0 10px rgba(255, 215, 0, 0.5)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
              }}
            >
              Commission Split Logic
            </motion.h3>

            <div className="flex flex-wrap items-center justify-center gap-8 relative z-10">
              <motion.div
                className="text-center group cursor-pointer"
                whileHover={{ scale: 1.1, y: -10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div
                  className="w-20 h-20 bg-gradient-to-r from-gold to-yellow-500 rounded-2xl flex items-center justify-center text-dark font-bold text-2xl mb-3 shadow-lg relative overflow-hidden"
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(255, 215, 0, 0.3)",
                      "0 0 40px rgba(255, 215, 0, 0.6)",
                      "0 0 20px rgba(255, 215, 0, 0.3)",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                  whileHover={{
                    boxShadow: "0 0 60px rgba(255, 215, 0, 0.8)",
                    rotate: [0, 5, -5, 0],
                  }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{
                      x: [-100, 100],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatDelay: 2,
                    }}
                  />
                  4%
                </motion.div>
                <p className="text-sm text-gray-300 font-medium group-hover:text-gold transition-colors">
                  DSA Commission
                </p>
              </motion.div>

              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                }}
              >
                <Plus className="text-gold w-8 h-8 drop-shadow-lg" />
              </motion.div>

              <motion.div
                className="text-center group cursor-pointer"
                whileHover={{ scale: 1.1, y: -10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div
                  className="w-20 h-20 bg-gradient-to-r from-blue to-cyan-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-3 shadow-lg relative overflow-hidden"
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(0, 122, 255, 0.3)",
                      "0 0 40px rgba(0, 122, 255, 0.6)",
                      "0 0 20px rgba(0, 122, 255, 0.3)",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: 0.5,
                  }}
                  whileHover={{
                    boxShadow: "0 0 60px rgba(0, 122, 255, 0.8)",
                    rotate: [0, -5, 5, 0],
                  }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{
                      x: [-100, 100],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatDelay: 2,
                      delay: 1,
                    }}
                  />
                  1%
                </motion.div>
                <p className="text-sm text-gray-300 font-medium group-hover:text-blue transition-colors">
                  Platform Fee
                </p>
              </motion.div>

              <motion.div
                className="text-gold text-3xl font-bold"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                }}
              >
                =
              </motion.div>

              <motion.div
                className="text-center group cursor-pointer"
                whileHover={{ scale: 1.1, y: -10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div
                  className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-3 shadow-lg relative overflow-hidden"
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(34, 197, 94, 0.3)",
                      "0 0 40px rgba(34, 197, 94, 0.6)",
                      "0 0 20px rgba(34, 197, 94, 0.3)",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: 1,
                  }}
                  whileHover={{
                    boxShadow: "0 0 60px rgba(34, 197, 94, 0.8)",
                    rotate: [0, 10, -10, 0],
                  }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{
                      x: [-100, 100],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatDelay: 2,
                      delay: 1.5,
                    }}
                  />
                  5%
                </motion.div>
                <p className="text-sm text-gray-300 font-medium group-hover:text-green-400 transition-colors">
                  Total Commission
                </p>
              </motion.div>
            </div>

            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
              <motion.path
                d="M 25% 50% Q 50% 30% 75% 50%"
                stroke="rgba(255, 215, 0, 0.3)"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
              />
            </svg>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-20 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              className="text-4xl md:text-5xl font-bold mb-6 gradient-text"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Why Choose LendGrid?
            </motion.h2>
            <motion.p
              className="text-xl text-gray-300 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Empowering aggregators and lenders with cutting-edge technology and seamless integration
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-20">
            {/* Aggregator Benefits */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-gold to-yellow-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl cursor-pointer">
                  <TrendingUp className="w-10 h-10 text-dark" />
                </div>
                <h3 className="text-3xl font-bold text-gold mb-4">Aggregator Benefits</h3>
              </div>

              <div className="space-y-6">
                {[
                  {
                    icon: TrendingUp,
                    title: "Higher Commission Splits",
                    desc: "Earn up to 4% commission on every successful loan disbursal with transparent tracking",
                  },
                  {
                    icon: Shield,
                    title: "Access to Premium Lenders",
                    desc: "Connect with top-tier banks and NBFCs for better conversion rates and customer satisfaction",
                  },
                  {
                    icon: Zap,
                    title: "Automated Payout Tracking",
                    desc: "Real-time commission tracking with automated payout notifications and detailed analytics",
                  },
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="enhanced-card hover:border-gold/30 transition-all duration-300">
                      <CardContent className="p-6 flex items-start space-x-4">
                        <div className="w-14 h-14 bg-gold/20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <benefit.icon className="w-7 h-7 text-gold" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold mb-2 text-white">{benefit.title}</h4>
                          <p className="text-gray-300 leading-relaxed">{benefit.desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Lender Benefits */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-blue to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl cursor-pointer">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-blue mb-4">Lender Benefits</h3>
              </div>

              <div className="space-y-6">
                {[
                  {
                    icon: Users,
                    title: "Extensive Aggregator Network",
                    desc: "Access to verified DSAs and loan aggregators across India with proven track records",
                  },
                  {
                    icon: BarChart3,
                    title: "Real-time Disbursal Insights",
                    desc: "Comprehensive analytics and performance tracking dashboard with actionable insights",
                  },
                  {
                    icon: CreditCard,
                    title: "Managed Commission Payouts",
                    desc: "Automated commission calculations with dispute resolution and transparent reporting",
                  },
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="enhanced-card hover:border-blue/30 transition-all duration-300">
                      <CardContent className="p-6 flex items-start space-x-4">
                        <div className="w-14 h-14 bg-blue/20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <benefit.icon className="w-7 h-7 text-blue" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold mb-2 text-white">{benefit.title}</h4>
                          <p className="text-gray-300 leading-relaxed">{benefit.desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {
        <section>

        </section>
      }


      {/* Pain Points Section: Borrowers, Lenders, Aggregators */}
      <section id="pain-points" className="px-6 py-20 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-6 gradient-text"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Common Pain Points
          </motion.h2>
          <motion.p
            className="text-xl text-gray-300 mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Challenges faced by Borrowers, Lenders and Aggregators...!
          </motion.p>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="enhanced-card h-full hover:shadow-2xl hover:-translate-y-2 transform transition-all duration-300 border-l-4 border-gold/60">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-gold/20 flex items-center justify-center text-gold">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gold mb-2 leading-tight">Borrowers</h3>
                      <p className="text-gray-500 mb-3 leading-relaxed">Common issues borrowers face:
                        <br />
                        <br />
                      </p>
                      <ul className="text-gray-300 space-y-2 text-sm text-left">
                        <li className="flex items-start"><span className="text-gold mr-2">●</span>slow approvals</li>
                        <li className="flex items-start"><span className="text-gold mr-2">●</span>Difficult to compare lenders</li>
                        <li className="flex items-start"><span className="text-gold mr-2">●</span>Confusing interest rates</li>
                        <li className="flex items-start"><span className="text-gold mr-2">●</span>Lack of transparency</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="enhanced-card h-full hover:shadow-2xl hover:-translate-y-2 transform transition-all duration-300 border-l-4 border-blue/50">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-blue/10 flex items-center justify-center text-blue">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-blue mb-2 leading-tight">Lenders</h3>
                      <p className="text-gray-500 mb-3 leading-relaxed">Challenges lenders experience:
                        <br />
                        <br />
                      </p>
                      <ul className="text-gray-300 space-y-2 text-sm text-left">
                        <li className="flex items-start"><span className="text-blue mr-2">●</span>incomplete applications</li>
                        <li className="flex items-start"><span className="text-blue mr-2">●</span>High drop-offs</li>
                        <li className="flex items-start"><span className="text-blue mr-2">●</span>Repeated follow-ups</li>
                        <li className="flex items-start"><span className="text-blue mr-2">●</span>Low conversion rate</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="enhanced-card h-full hover:shadow-2xl hover:-translate-y-2 transform transition-all duration-300 border-l-4 border-green-400/40">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-green-100/10 flex items-center justify-center text-green-400">
                      <Percent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-green-400 mb-2 leading-tight">Aggregators</h3>
                      <p className="text-gray-500 mb-3 leading-relaxed">Pain points aggregators often report:
                       <br />
                       <br />
                      </p>
                      <ul className="text-gray-300 space-y-2 text-sm text-left">
                        <li className="flex items-start"><span className="text-green-400 mr-2">●</span>no real time loan updates</li>
                        <li className="flex items-start"><span className="text-green-400 mr-2">●</span>Unclear commission terms</li>
                        <li className="flex items-start"><span className="text-green-400 mr-2">●</span>Slow lender responses</li>
                        <li className="flex items-start"><span className="text-green-400 mr-2">●</span>Lack of product training</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How LendGrid Solves It - Features */}
      <section id="features-solution" className="px-6 py-20 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-6 gradient-text"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            How LendGrid Solves It
          </motion.h2>
          <motion.p
            className="text-xl text-gray-300 mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            One platform — powerful features to make lending simple, transparent and fast
          </motion.p>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="enhanced-card">
              <CardContent className="p-6 flex items-start space-x-4">
                <Percent className="w-6 h-6 text-gold mt-1" />
                <div className="text-left">
                  <h4 className="font-semibold text-white">All loans on one platform</h4>
                  <p className="text-gray-300 text-sm">Browse and compare products across multiple lenders</p>
                </div>
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardContent className="p-6 flex items-start space-x-4">
                <TrendingUp className="w-6 h-6 text-blue mt-1" />
                <div className="text-left">
                  <h4 className="font-semibold text-white">Track your loan live</h4>
                  <p className="text-gray-300 text-sm">Real-time status updates from application to disbursal</p>
                </div>
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardContent className="p-6 flex items-start space-x-4">
                <CreditCard className="w-6 h-6 text-green-400 mt-1" />
                <div className="text-left">
                  <h4 className="font-semibold text-white">Lowest interest rates</h4>
                  <p className="text-gray-300 text-sm">Compare rates and pick the best fit for your needs</p>
                </div>
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardContent className="p-6 flex items-start space-x-4">
                <Calculator className="w-6 h-6 text-gold mt-1" />
                <div className="text-left">
                  <h4 className="font-semibold text-white">Instant eligibility check</h4>
                  <p className="text-gray-300 text-sm">Quick pre-checks to save time and reduce drop-offs</p>
                </div>
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardContent className="p-6 flex items-start space-x-4">
                <Users className="w-6 h-6 text-blue mt-1" />
                <div className="text-left">
                  <h4 className="font-semibold text-white">Expert guidance</h4>
                  <p className="text-gray-300 text-sm">Help at every step from product selection to disbursal</p>
                </div>
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardContent className="p-6 flex items-start space-x-4">
                <Zap className="w-6 h-6 text-green-400 mt-1" />
                <div className="text-left">
                  <h4 className="font-semibold text-white">100% paperless process</h4>
                  <p className="text-gray-300 text-sm">Fast, secure e-docs and e-sign workflows</p>
                </div>
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardContent className="p-6 flex items-start space-x-4">
                <Building2 className="w-6 h-6 text-gold mt-1" />
                <div className="text-left">
                  <h4 className="font-semibold text-white">50+ lenders</h4>
                  <p className="text-gray-300 text-sm">Access a large network of banks, NBFCs and fintech lenders</p>
                </div>
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardContent className="p-6 flex items-start space-x-4">
                <Shield className="w-6 h-6 text-blue mt-1" />
                <div className="text-left">
                  <h4 className="font-semibold text-white">Safe, simple & transparent</h4>
                  <p className="text-gray-300 text-sm">Secure transactions with clear terms and easy UX</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-6 py-20 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              className="text-4xl md:text-5xl font-bold mb-6 gradient-text"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              What Our Partners Say
            </motion.h2>
            <motion.p
              className="text-xl text-gray-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Success stories from aggregators and lenders using LendGrid
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
              >
                <Card className="enhanced-card h-full">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-gold fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-300 mb-8 italic text-lg leading-relaxed">"{testimonial.review}"</p>
                    <div className="flex items-center space-x-4">
                      <Image
                        src={testimonial.image || "/placeholder.svg"}
                        alt={testimonial.name}
                        width={60}
                        height={60}
                        className="rounded-full border-2 border-gold/30"
                      />
                      <div>
                        <h4 className="font-semibold text-white text-lg">{testimonial.name}</h4>
                        <p className="text-sm text-gray-400">{testimonial.role}</p>
                        <p className="text-sm text-gold font-medium">{testimonial.company}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* Contact Form */}
      <section id="contact" className="px-6 py-20 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <motion.h2
              className="text-4xl md:text-5xl font-bold mb-6 gradient-text"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Ready to Get Started?
            </motion.h2>
            <motion.p
              className="text-xl text-gray-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Join thousands of aggregators and lenders already using LendGrid
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Card className="enhanced-card">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Full Name</label>
                      <Input
                        {...register("name", { required: "Name is required" })}
                        className="glass-input text-black placeholder-gray-400"
                        placeholder="Enter your full name"
                      />
                      {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message as string}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Email Address</label>
                      <Input
                        type="email"
                        {...register("email", { required: "Email is required" })}
                        className="glass-input text-black placeholder-gray-400"
                        placeholder="Enter your email"
                      />
                      {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message as string}</p>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Role</label>
                      <Select>
                        <SelectTrigger className="glass-input text-gray-600">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-white/10">
                          <SelectItem value="aggregator" className="text-black hover:bg-white/10">
                            Loan Aggregator
                          </SelectItem>
                          <SelectItem value="lender" className="text-black hover:bg-white/10">
                            Lender
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Company Name</label>
                      <Input
                        {...register("company", { required: "Company name is required" })}
                        className="glass-input text-black placeholder-gray-400"
                        placeholder="Enter company name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Message</label>
                    <Textarea
                      {...register("message")}
                      className="glass-input text-black placeholder-gray-400 min-h-[120px]"
                      placeholder="Tell us about your requirements..."
                    />
                  </div>

                  <Button type="submit" className="w-full btn-primary text-lg py-4 rounded-xl  hover:text-gold">
                    Submit Request
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 glass-card border-t border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient rounded-xl flex items-center justify-center shadow-lg">
                  <img
                    src="/logo.png" // Replace with your logo path
                    alt="LendGrid Logo"
                    className="w-12 h-10 rounded-xl "
                  />
                </div>
                <span className="text-2xl font-bold gradient-text text-gold">LendGrid</span>
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
      </footer>
    </div>
  )
}

export default LandingPage
