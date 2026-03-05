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

export default function Dashboard() {
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
    <div className="h-full overflow-y-auto bg-background p-6">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-6xl mx-auto space-y-8"
      >
        {/* Welcome */}
        <motion.div variants={item} className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {user?.name}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Here's what's happening in your knowledge base.
          </p>
        </motion.div>

        {/* Getting Started Guide - Show when no collections exist */}
        {collections.length === 0 && (
          <motion.div variants={item} className="card p-6 border-2 border-dashed border-primary/30 bg-primary/5">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Sparkles className="text-primary" size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  Getting Started Guide
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Follow these steps to start using your AI-powered knowledge base:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-background rounded-lg border border-border">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-2">
                        <Plus size={14} /> Create a Collection
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Go to <strong>Collections</strong> in the sidebar and click <strong>"New Collection"</strong> to organize your documents.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-background rounded-lg border border-border">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-bold text-sm shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-2">
                        <Upload size={14} /> Upload Documents
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click on your collection and <strong>drag & drop</strong> PDF, DOCX, or TXT files to upload.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-background rounded-lg border border-border">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold text-sm shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-2">
                        <Search size={14} /> Ask Questions
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Go to <strong>Chat</strong> and ask questions. The AI will answer using your uploaded documents.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Collections</p>
                <h3 className="text-3xl font-bold text-foreground mt-2">{collections.length}</h3>
              </div>
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <FolderOpen size={20} />
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              Active knowledge containers
            </div>
          </div>

          <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Documents</p>
                <h3 className="text-3xl font-bold text-foreground mt-2">{totalDocuments}</h3>
              </div>
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <FileText size={20} />
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              Total files processed
            </div>
          </div>

          <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Chunks</p>
                <h3 className="text-3xl font-bold text-foreground mt-2">{stats?.chunks || 0}</h3>
              </div>
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Layers size={20} />
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              Vector embeddings indexed
            </div>
          </div>

          <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversations</p>
                <h3 className="text-3xl font-bold text-foreground mt-2">{conversations.length}</h3>
              </div>
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                <MessageSquare size={20} />
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              Chat sessions created
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Activity / Conversations */}
            <motion.div variants={item} className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Clock size={18} className="text-muted-foreground" />
                  Recent Conversations
                </h2>
                <button className="text-sm text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight size={14} />
                </button>
              </div>
              
              {conversations.length === 0 ? (
                <div className="text-center py-10 bg-secondary/30 rounded-lg border border-border border-dashed">
                  <MessageSquare size={32} className="mx-auto text-muted-foreground mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">No conversations started yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.slice(0, 5).map((conv: any) => (
                    <div
                      key={conv.id}
                      className="group flex items-center justify-between p-3 hover:bg-secondary/50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-border"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                          AI
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {conv.title}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {conv.message_count} messages • {formatDate(conv.updated_at)}
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* System Health */}
            {healthStatus && (
              <motion.div variants={item} className="card p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Activity size={18} className="text-muted-foreground" />
                  System Health
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    healthStatus.checks?.mongodb ? "bg-green-50/50 border-green-200" : "bg-red-50/50 border-red-200"
                  )}>
                    {healthStatus.checks?.mongodb ? (
                      <CheckCircle size={18} className="text-green-600 shrink-0" />
                    ) : (
                      <XCircle size={18} className="text-red-600 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">MongoDB</p>
                      <p className="text-xs text-muted-foreground">Database</p>
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    (healthStatus.ai_provider === "groq" || healthStatus.checks?.ollama) 
                      ? "bg-green-50/50 border-green-200" 
                      : "bg-red-50/50 border-red-200"
                  )}>
                    {(healthStatus.ai_provider === "groq" || healthStatus.checks?.ollama) ? (
                      <CheckCircle size={18} className="text-green-600 shrink-0" />
                    ) : (
                      <XCircle size={18} className="text-red-600 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">AI Provider</p>
                      <p className="text-xs text-muted-foreground capitalize">{healthStatus.ai_provider}</p>
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    healthStatus.checks?.chromadb ? "bg-green-50/50 border-green-200" : "bg-red-50/50 border-red-200"
                  )}>
                    {healthStatus.checks?.chromadb ? (
                      <CheckCircle size={18} className="text-green-600 shrink-0" />
                    ) : (
                      <XCircle size={18} className="text-red-600 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">ChromaDB</p>
                      <p className="text-xs text-muted-foreground">Vector Store</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar Area (1 col) */}
          <div className="space-y-6">
            {/* Recent Collections */}
            <motion.div variants={item} className="card p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <FolderOpen size={18} className="text-muted-foreground" />
                  Collections
                </h2>
                <button className="p-1 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowRight size={16} />
                </button>
              </div>
              
              {collections.length === 0 ? (
                 <div className="text-center py-10">
                  <p className="text-sm text-muted-foreground">No collections yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {collections.slice(0, 5).map((col: any) => (
                    <div
                      key={col.id}
                      className="p-3 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {col.name}
                        </p>
                        <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
                          {col.document_count} docs
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {formatDate(col.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
