"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { navigationPaths } from "@/lib/navigation";

export default function Navbar() {
  return (
    <div className="fixed top-0 left-0 w-full z-50 px-6 py-4 backdrop-blur-lg bg-opacity-50  border-white/10 ">
      {<div className="max-w-7xl mx-auto flex items-center justify-between">
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
          {["Features", "Solution", "Testimonials", "Contact"].map((item, index) => (
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
      </div>}
    </div>
  );
}
