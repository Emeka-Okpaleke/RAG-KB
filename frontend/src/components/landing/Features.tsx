"use client";

import { motion } from "framer-motion";
import { Globe } from "./Globe";
import { Zap, Shield, Search, Database } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Semantic Search",
    description: "Find exactly what you're looking for, not just keyword matches. Our AI understands the intent behind your queries."
  },
  {
    icon: Database,
    title: "Dynamic Knowledge",
    description: "Upload any document format. We process and index your data in real-time, making it immediately accessible."
  },
  {
    icon: Zap,
    title: "Instant Answers",
    description: "Get direct answers to your questions, cited with sources from your own documents. No more searching through files."
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data stays yours. Enterprise-grade encryption and strict access controls ensure your knowledge is safe."
  }
];

export function Features() {
  return (
    <section className="py-24 bg-zinc-950 text-white relative overflow-hidden">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
          
          {/* Text Content */}
          <div className="flex-1 space-y-8 z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Global Knowledge, <br />
                <span className="text-primary">Locally Accessible.</span>
              </h2>
              <p className="text-zinc-400 text-lg leading-relaxed max-w-xl">
                Connect your disparate data sources into one unified intelligence engine. 
                Visualize your knowledge graph and interact with it naturally.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="flex gap-4 items-start p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    <feature.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Globe Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="flex-1 flex justify-center items-center relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-blue-600/20 rounded-full blur-[100px] opacity-30" />
            <Globe className="w-full max-w-[600px] drop-shadow-2xl" />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
