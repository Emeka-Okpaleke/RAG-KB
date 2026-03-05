"use client";

import { Hero } from "./landing/Hero";
import { Features } from "./landing/Features";
import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-primary/30">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-zinc-950/50 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
              <BookOpen size={18} strokeWidth={3} />
            </div>
            <span className="font-bold text-lg tracking-tight">Strut KB</span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={onGetStarted}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block"
            >
              Sign In
            </button>
            <button 
              onClick={onGetStarted}
              className="px-4 py-2 rounded-full bg-white text-zinc-950 text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main>
        <div onClick={onGetStarted}>
             <Hero />
        </div>
        <Features />
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 bg-zinc-950 text-center text-zinc-500 text-sm">
        <p>
            Made by <span className="text-zinc-300 font-medium">Olisemeka Okpaleke</span> • olisemekaokpaleke08@gmail.com
        </p>
      </footer>
    </div>
  );
}
