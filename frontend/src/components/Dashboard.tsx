"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { collectionsAPI, queryAPI, healthAPI } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  FolderOpen,
  FileText,
  MessageSquare,
  Activity,
  CheckCircle,
  XCircle,
  Database,
  Bot,
  Layers,
  ArrowRight,
  Clock,
  Plus,
  Search,
  Sparkles,
  MoreVertical,
  Bell,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardProps {
  onViewChange: (view: string, id?: string) => void;
}

export default function Dashboard({ onViewChange }: DashboardProps) {
  const { user, token } = useAuth();
  const [collections, setCollections] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!token) return;

    Promise.all([
      collectionsAPI.list(token),
      queryAPI.listConversations(token),
      healthAPI.ready().catch(() => null),
      healthAPI.stats().catch(() => null),
    ]).then(([colRes, convRes, health, statsRes]) => {
      setCollections(colRes.data || []);
      setConversations(convRes.data || []);
      setHealthStatus(health);
      setStats(statsRes);
    });
  }, [token]);

  const totalDocuments = collections.reduce(
    (sum: number, c: any) => sum + (c.document_count || 0),
    0
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50/50 dark:bg-background p-6">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-4 gap-8"
      >
        {/* Main Content Area (Left - 3 Cols) */}
        <div className="xl:col-span-3 space-y-8">
          
          {/* Top Bar / Search */}
          <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="text" 
                placeholder="Search your knowledge base..." 
                className="w-full pl-10 pr-4 py-3 rounded-2xl border-none bg-white dark:bg-card shadow-sm focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
               <button className="p-3 bg-white dark:bg-card rounded-full shadow-sm text-muted-foreground hover:text-foreground transition-colors relative">
                 <Bell size={20} />
                 <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-card"></span>
               </button>
               <button className="p-3 bg-white dark:bg-card rounded-full shadow-sm text-muted-foreground hover:text-foreground transition-colors">
                 <Settings size={20} />
               </button>
            </div>
          </motion.div>

          {/* Hero Banner */}
          <motion.div variants={item} className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg p-8 md:p-12">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 max-w-2xl">
              <span className="inline-block py-1 px-3 rounded-full bg-white/20 text-xs font-medium mb-4 backdrop-blur-sm border border-white/10">
                AI-Powered Knowledge Base
              </span>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                Unlock Insights from Your Documents <br/> with RAG Technology
              </h1>
              <p className="text-blue-100 mb-8 max-w-lg text-lg">
                Upload documents, create collections, and start asking questions to get instant, cited answers.
              </p>
              <button 
                onClick={() => onViewChange("chat")}
                className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                Start Chatting <ArrowRight size={18} />
              </button>
            </div>
            
            {/* Decorative Sparkles */}
            <Sparkles className="absolute top-10 right-10 text-white/30 w-24 h-24 animate-pulse" strokeWidth={1} />
          </motion.div>

          {/* Quick Stats Grid (Mini Cards) */}
          <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             {[
               { label: "Active Collections", value: collections.length, icon: FolderOpen, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
               { label: "Total Documents", value: totalDocuments, icon: FileText, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-900/20" },
               { label: "Conversations", value: conversations.length, icon: MessageSquare, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
             ].map((stat, i) => (
               <div key={i} className="bg-white dark:bg-card p-4 rounded-2xl shadow-sm border border-border/50 flex items-center gap-4">
                 <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
                   <stat.icon size={24} />
                 </div>
                 <div>
                   <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
                   <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</p>
                 </div>
                 <button className="ml-auto text-muted-foreground hover:text-foreground">
                   <MoreVertical size={16} />
                 </button>
               </div>
             ))}
          </motion.div>

          {/* Recent Collections (Grid) */}
          <motion.div variants={item}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Recent Collections</h2>
              <button 
                onClick={() => onViewChange("collections")}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-card shadow-sm border border-border text-primary hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <ArrowRight size={16} />
              </button>
            </div>
            
            {collections.length === 0 ? (
              <div className="bg-white dark:bg-card rounded-3xl p-8 text-center border border-border border-dashed">
                <FolderOpen size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-foreground">No collections yet</h3>
                <p className="text-muted-foreground mb-6">Create a collection to organize your documents.</p>
                <button onClick={() => onViewChange("collections")} className="text-primary font-medium hover:underline">Create Collection</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.slice(0, 3).map((col) => (
                  <div 
                    key={col.id}
                    onClick={() => onViewChange("collection", col.id)}
                    className="bg-white dark:bg-card p-5 rounded-3xl shadow-sm border border-border/50 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-secondary rounded-2xl text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <FolderOpen size={24} />
                      </div>
                      <button className="text-muted-foreground hover:text-foreground">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                    
                    <h3 className="font-bold text-lg text-foreground mb-1 truncate">{col.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                      {col.description || "No description provided."}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-lg">
                        {col.document_count} files
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={12} /> {formatDate(col.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
                
                {/* Create New Card */}
                <button 
                  onClick={() => onViewChange("collections")}
                  className="bg-secondary/30 border-2 border-dashed border-border rounded-3xl p-5 flex flex-col items-center justify-center gap-3 hover:bg-secondary/50 hover:border-primary/50 transition-all group text-muted-foreground hover:text-primary"
                >
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-card flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Plus size={24} />
                  </div>
                  <span className="font-medium">Create New</span>
                </button>
              </div>
            )}
          </motion.div>

          {/* Recent Conversations (List) */}
          <motion.div variants={item}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Recent Activity</h2>
              <button 
                onClick={() => onViewChange("chat")}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                See all
              </button>
            </div>

            <div className="bg-white dark:bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No recent activity</div>
              ) : (
                <div className="divide-y divide-border/50">
                  {conversations.slice(0, 5).map((conv) => (
                    <div 
                      key={conv.id}
                      onClick={() => onViewChange("conversation", conv.id)}
                      className="p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                        AI
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {conv.title}
                        </h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide">
                            Chat
                          </span>
                          <span>•</span>
                          <span>{formatDate(conv.updated_at)}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                         <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full flex items-center gap-1">
                           <MessageSquare size={12} /> {conv.message_count}
                         </span>
                         <button className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-primary hover:text-white hover:border-primary transition-all">
                           <ArrowRight size={14} />
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

        </div>

        {/* Right Sidebar (1 Col) */}
        <motion.div variants={item} className="xl:col-span-1 space-y-8">
          
          {/* Profile Card */}
          <div className="bg-white dark:bg-card rounded-3xl p-6 shadow-sm border border-border/50 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary/20 to-purple-500/20 z-0"></div>
            
            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto bg-white dark:bg-card p-1 rounded-full mb-3 shadow-md">
                 <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-3xl text-white font-bold">
                   {user?.name?.charAt(0).toUpperCase()}
                 </div>
              </div>
              
              <h2 className="text-xl font-bold text-foreground">Good Morning, {user?.name?.split(' ')[0]}!</h2>
              <p className="text-sm text-muted-foreground mb-6">Continue your learning journey.</p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-secondary/50 p-3 rounded-2xl">
                  <span className="block text-2xl font-bold text-primary">{collections.length}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Collections</span>
                </div>
                <div className="bg-secondary/50 p-3 rounded-2xl">
                   <span className="block text-2xl font-bold text-violet-600">{stats?.chunks || 0}</span>
                   <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Chunks</span>
                </div>
              </div>
              
              <button className="w-full py-3 bg-foreground text-background rounded-xl font-medium hover:opacity-90 transition-opacity">
                View Profile
              </button>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white dark:bg-card rounded-3xl p-6 shadow-sm border border-border/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-foreground">System Health</h3>
              <button className="text-muted-foreground hover:text-foreground">
                <MoreVertical size={16} />
              </button>
            </div>

            {healthStatus ? (
              <div className="space-y-4">
                {[
                  { label: "MongoDB", sub: "Database", status: healthStatus.checks?.mongodb, icon: Database },
                  { label: "AI Provider", sub: healthStatus.ai_provider, status: (healthStatus.ai_provider === "groq" || healthStatus.checks?.ollama), icon: Bot },
                  { label: "ChromaDB", sub: "Vector Store", status: healthStatus.checks?.chromadb, icon: Layers },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                      item.status ? "bg-green-50 text-green-600 dark:bg-green-900/20" : "bg-red-50 text-red-600 dark:bg-red-900/20"
                    )}>
                      <item.icon size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-sm">{item.label}</h4>
                      <p className="text-xs text-muted-foreground capitalize">{item.sub}</p>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      item.status ? "bg-green-100 text-green-700 dark:bg-green-900/40" : "bg-red-100 text-red-700 dark:bg-red-900/40"
                    )}>
                      {item.status ? "Active" : "Issue"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
               <div className="text-center py-4 text-muted-foreground text-sm">Loading status...</div>
            )}
          </div>

          {/* Storage / Usage (Mock) */}
           <div className="bg-white dark:bg-card rounded-3xl p-6 shadow-sm border border-border/50">
             <h3 className="font-bold text-foreground mb-4">Storage Usage</h3>
             <div className="relative pt-2">
               <div className="flex items-end justify-between text-sm mb-2">
                 <span className="font-medium text-foreground">{(stats?.chunks || 0) * 0.5} KB</span>
                 <span className="text-muted-foreground">1 GB Limit</span>
               </div>
               <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                 <div 
                   className="bg-primary h-full rounded-full transition-all duration-1000" 
                   style={{ width: `${Math.min(((stats?.chunks || 0) / 1000) * 100, 100)}%` }}
                 ></div>
               </div>
               <p className="text-xs text-muted-foreground mt-3">
                 Your vector database usage is healthy.
               </p>
             </div>
           </div>

        </motion.div>

      </motion.div>
    </div>
  );
}
