"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { BookOpen, AlertCircle, ArrowRight, Loader2, Star, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Panel - Visuals & Testimonials (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-zinc-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Abstract Background */}
        <div 
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')",
            filter: "grayscale(100%) contrast(120%)"
          }} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/80 to-zinc-900/40" />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white text-zinc-900 flex items-center justify-center shadow-lg shadow-white/10">
              <BookOpen size={18} strokeWidth={3} />
            </div>
            <span className="font-bold text-lg tracking-tight">Strut Knowledge Base</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex gap-1 mb-6 text-white">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={16} fill="currentColor" className="text-white" />
              ))}
            </div>
            <blockquote className="text-3xl font-medium leading-tight mb-8 tracking-tight">
              "The ability to instantly chat with our entire knowledge base has transformed our workflow. It's not just a tool, it's our team's second brain."
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-600 flex items-center justify-center text-sm font-bold border border-zinc-500/50">
                OO
              </div>
              <div>
                <p className="font-semibold text-white">Olisemeka Okpaleke</p>
                <p className="text-sm text-zinc-400">Lead Developer & Creator</p>
              </div>
            </div>
          </motion.div>
        </div>
        
        <div className="relative z-10 flex justify-between items-center text-sm text-zinc-500">
          <p>© 2024 Strut KB. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-zinc-300 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-zinc-300 cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
              <BookOpen size={20} strokeWidth={3} />
            </div>
          </div>

          <div className="text-center lg:text-left space-y-2">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              {isLogin ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin 
                ? "Enter your email to sign in to your workspace." 
                : "Enter your details below to create your account."}
            </p>
          </div>

          <div className="bg-secondary/30 p-1 rounded-xl grid grid-cols-2 gap-1">
             <button
              onClick={() => { setIsLogin(true); setError(""); }}
              className={cn(
                "flex items-center justify-center py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                isLogin 
                  ? "bg-background text-foreground shadow-sm ring-1 ring-black/5" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(""); }}
              className={cn(
                "flex items-center justify-center py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                !isLogin 
                  ? "bg-background text-foreground shadow-sm ring-1 ring-black/5" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              Sign Up
            </button>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-3 p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span className="flex-1">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pb-4">
                    <label className="block text-xs font-medium text-foreground mb-1.5 ml-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required={!isLogin}
                      className="input-field h-11 bg-background"
                      autoFocus={!isLogin}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5 ml-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="input-field h-11 bg-background"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-foreground mb-1.5 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="input-field h-11 bg-background"
              />
              {isLogin && (
                <div className="flex justify-end pt-1">
                  <a href="#" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                    Forgot password?
                  </a>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="btn-primary w-full h-11 mt-4 text-sm group relative overflow-hidden"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin mr-2" />
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>{isLogin ? "Sign In" : "Create Account"}</span>
                  <ArrowRight size={16} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                </div>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <button type="button" className="btn-secondary h-10 w-full bg-background" disabled>
               <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
             </button>
             <button type="button" className="btn-secondary h-10 w-full bg-background" disabled>
               <svg className="mr-2 h-4 w-4 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
               </svg>
               GitHub
             </button>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
            <p className="text-[10px] text-muted-foreground">
                Made by <span className="font-semibold text-foreground">Olisemeka Okpaleke</span> • olisemekaokpaleke08@gmail.com
            </p>
        </div>
      </div>
    </div>
  );
}
