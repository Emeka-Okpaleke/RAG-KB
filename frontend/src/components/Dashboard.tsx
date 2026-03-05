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
  Upload,
  Search,
  Sparkles
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
    <div className="h-full overflow-y-auto bg-gradient-to-br from-background to-secondary/20 p-6 md:p-8">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Welcome Header */}
        <motion.div variants={item} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Welcome back, {user?.name}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Manage your knowledge base and AI interactions.
            </p>
          </div>
          <button 
            onClick={() => onViewChange("chat")}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
          >
            <MessageSquare size={18} />
            Start New Chat
          </button>
        </motion.div>

        {/* Getting Started Guide - Show when no collections exist */}
        {collections.length === 0 && (
          <motion.div variants={item} className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-8 shadow-sm">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
            
            <div className="flex items-start gap-6 relative z-10">
              <div className="p-4 bg-background shadow-sm rounded-2xl border border-primary/10">
                <Sparkles className="text-primary" size={32} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  Let's set up your Knowledge Base
                </h2>
                <p className="text-muted-foreground mb-6 max-w-2xl">
                  Follow these simple steps to empower your AI with your own documents.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Step 1 */}
                  <div 
                    onClick={() => onViewChange("collections")}
                    className="group bg-background/60 backdrop-blur-sm p-5 rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm shrink-0 shadow-sm">
                        1
                      </div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Create Collection</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Create a dedicated space for your related documents.
                    </p>
                  </div>
                  
                  {/* Step 2 */}
                  <div className="bg-background/60 backdrop-blur-sm p-5 rounded-xl border border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-bold text-sm shrink-0 shadow-sm">
                        2
                      </div>
                      <h3 className="font-semibold text-foreground">Upload Documents</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Upload PDF, DOCX, or TXT files to train your AI.
                    </p>
                  </div>
                  
                  {/* Step 3 */}
                  <div 
                    onClick={() => onViewChange("chat")}
                    className="group bg-background/60 backdrop-blur-sm p-5 rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold text-sm shrink-0 shadow-sm">
                        3
                      </div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Start Chatting</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Ask questions and get answers based on your data.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-blue-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Collections</p>
                <h3 className="text-4xl font-bold text-foreground mt-2">{collections.length}</h3>
              </div>
              <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
                <FolderOpen size={24} />
              </div>
            </div>
          </div>

          <div className="card p-6 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-green-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Documents</p>
                <h3 className="text-4xl font-bold text-foreground mt-2">{totalDocuments}</h3>
              </div>
              <div className="p-3 bg-green-500/10 text-green-600 rounded-xl">
                <FileText size={24} />
              </div>
            </div>
          </div>

          <div className="card p-6 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-purple-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Chunks</p>
                <h3 className="text-4xl font-bold text-foreground mt-2">{stats?.chunks || 0}</h3>
              </div>
              <div className="p-3 bg-purple-500/10 text-purple-600 rounded-xl">
                <Layers size={24} />
              </div>
            </div>
          </div>

          <div className="card p-6 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-amber-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Conversations</p>
                <h3 className="text-4xl font-bold text-foreground mt-2">{conversations.length}</h3>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
                <MessageSquare size={24} />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity / Conversations */}
          <motion.div variants={item} className="lg:col-span-2 space-y-6">
            <div className="card p-6 h-full border border-border/50 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Clock size={20} className="text-muted-foreground" />
                  Recent Conversations
                </h2>
                <button 
                  onClick={() => onViewChange("chat")}
                  className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                >
                  View all <ArrowRight size={16} />
                </button>
              </div>
              
              {conversations.length === 0 ? (
                <div className="text-center py-12 bg-secondary/20 rounded-xl border border-dashed border-border">
                  <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <MessageSquare size={24} className="text-muted-foreground/50" />
                  </div>
                  <h3 className="text-foreground font-medium mb-1">No conversations yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Start chatting to see your history here.</p>
                  <button 
                    onClick={() => onViewChange("chat")}
                    className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Start Chat
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversations.slice(0, 5).map((conv: any) => (
                    <div
                      key={conv.id}
                      onClick={() => onViewChange("conversation", conv.id)}
                      className="group flex items-center justify-between p-4 bg-background hover:bg-secondary/40 rounded-xl transition-all cursor-pointer border border-transparent hover:border-border/60 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center shrink-0 font-bold text-xs shadow-inner">
                          AI
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {conv.title}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1 bg-secondary px-1.5 py-0.5 rounded-md">
                              <MessageSquare size={10} /> {conv.message_count}
                            </span>
                            <span>•</span>
                            <span>{formatDate(conv.updated_at)}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-background border border-border opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <ArrowRight size={14} className="text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* System Health */}
            {healthStatus && (
              <div className="card p-6 border border-border/50 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Activity size={20} className="text-muted-foreground" />
                  System Health
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border transition-all",
                    healthStatus.checks?.mongodb 
                      ? "bg-green-500/5 border-green-500/20" 
                      : "bg-red-500/5 border-red-500/20"
                  )}>
                    {healthStatus.checks?.mongodb ? (
                      <div className="p-1.5 bg-green-500/10 rounded-full text-green-600">
                        <CheckCircle size={16} />
                      </div>
                    ) : (
                      <div className="p-1.5 bg-red-500/10 rounded-full text-red-600">
                        <XCircle size={16} />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">MongoDB</p>
                      <p className="text-xs text-muted-foreground">Database</p>
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border transition-all",
                    (healthStatus.ai_provider === "groq" || healthStatus.checks?.ollama) 
                      ? "bg-green-500/5 border-green-500/20" 
                      : "bg-red-500/5 border-red-500/20"
                  )}>
                    {(healthStatus.ai_provider === "groq" || healthStatus.checks?.ollama) ? (
                      <div className="p-1.5 bg-green-500/10 rounded-full text-green-600">
                        <CheckCircle size={16} />
                      </div>
                    ) : (
                      <div className="p-1.5 bg-red-500/10 rounded-full text-red-600">
                        <XCircle size={16} />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">AI Provider</p>
                      <p className="text-xs text-muted-foreground capitalize">{healthStatus.ai_provider}</p>
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border transition-all",
                    healthStatus.checks?.chromadb 
                      ? "bg-green-500/5 border-green-500/20" 
                      : "bg-red-500/5 border-red-500/20"
                  )}>
                    {healthStatus.checks?.chromadb ? (
                      <div className="p-1.5 bg-green-500/10 rounded-full text-green-600">
                        <CheckCircle size={16} />
                      </div>
                    ) : (
                      <div className="p-1.5 bg-red-500/10 rounded-full text-red-600">
                        <XCircle size={16} />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">ChromaDB</p>
                      <p className="text-xs text-muted-foreground">Vector Store</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Recent Collections */}
          <motion.div variants={item} className="space-y-6">
            <div className="card p-6 h-full border border-border/50 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <FolderOpen size={20} className="text-muted-foreground" />
                  Collections
                </h2>
                <button 
                  onClick={() => onViewChange("collections")}
                  className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
              
              {collections.length === 0 ? (
                 <div className="text-center py-12 flex-1 flex flex-col items-center justify-center">
                  <FolderOpen size={48} className="text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">No collections yet</p>
                  <button 
                    onClick={() => onViewChange("collections")}
                    className="mt-4 text-sm font-medium text-primary hover:underline"
                  >
                    Create your first collection
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {collections.slice(0, 5).map((col: any) => (
                    <div
                      key={col.id}
                      onClick={() => onViewChange("collection", col.id)}
                      className="p-4 rounded-xl border border-border bg-background hover:bg-secondary/40 hover:border-primary/30 hover:shadow-sm transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate pr-2">
                          {col.name}
                        </p>
                        <span className="text-[10px] bg-secondary px-2 py-1 rounded-full text-muted-foreground font-medium shrink-0">
                          {col.document_count} docs
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={10} /> {formatDate(col.created_at)}
                      </p>
                    </div>
                  ))}
                  
                  {collections.length > 5 && (
                    <button 
                      onClick={() => onViewChange("collections")}
                      className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors text-center border border-dashed border-border rounded-lg hover:bg-secondary/30"
                    >
                      View {collections.length - 5} more...
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
