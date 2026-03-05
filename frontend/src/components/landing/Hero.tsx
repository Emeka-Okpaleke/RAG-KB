"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-zinc-950 text-white pt-20">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-30 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] opacity-30 animate-pulse delay-1000" />
      </div>

      <div className="container px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-medium text-zinc-300 mb-6"
        >
          <Sparkles size={12} className="text-primary" />
          <span>The Next Generation Knowledge Base</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 mb-6 max-w-4xl"
        >
          Chat with your documents using <span className="text-primary">AI-Powered</span> Intelligence
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed"
        >
          Upload files, ask questions, and get instant, cited answers. 
          RAG Knowledge Base transforms your static documents into an interactive brain.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <button className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 group">
            Get Started Free
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="px-8 py-3 rounded-full bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all backdrop-blur-md">
            View Documentation
          </button>
        </motion.div>

        {/* Glass Card Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 w-full max-w-5xl rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-2 md:p-4"
        >
          <div className="rounded-lg overflow-hidden border border-white/5 bg-zinc-900/50 aspect-video relative">
            {/* Mock UI */}
            <div className="absolute inset-0 flex">
              <div className="w-64 border-r border-white/10 bg-zinc-900/50 hidden md:block p-4 space-y-4">
                <div className="h-8 w-8 rounded bg-primary/20" />
                <div className="space-y-2">
                  <div className="h-2 w-20 rounded bg-white/10" />
                  <div className="h-2 w-32 rounded bg-white/10" />
                  <div className="h-2 w-24 rounded bg-white/10" />
                </div>
              </div>
              <div className="flex-1 p-6 flex flex-col">
                 <div className="flex-1 space-y-6">
                    <div className="flex gap-4">
                       <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
                       <div className="space-y-2 flex-1">
                          <div className="h-4 w-1/3 rounded bg-white/10" />
                          <div className="h-16 w-3/4 rounded bg-white/5" />
                       </div>
                    </div>
                    <div className="flex gap-4 flex-row-reverse">
                       <div className="w-8 h-8 rounded-full bg-primary shrink-0" />
                       <div className="space-y-2 flex-1 flex flex-col items-end">
                          <div className="h-4 w-1/4 rounded bg-primary/20" />
                          <div className="h-10 w-1/2 rounded bg-primary/10" />
                       </div>
                    </div>
                 </div>
                 <div className="mt-6 h-12 rounded-lg border border-white/10 bg-white/5" />
              </div>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-50" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
