"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { queryAPI, collectionsAPI } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Clock,
  MoreHorizontal,
  Share2,
  PanelRight,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Source {
  document_id: string;
  document_name: string;
  content: string;
  chunk_index: number;
  relevance_score: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  query_time_ms?: number;
}

interface ChatViewProps {
  conversationId?: string;
}

export default function ChatView({ conversationId }: ChatViewProps) {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentConvId, setCurrentConvId] = useState(conversationId || "");
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!token) return;
    collectionsAPI.list(token).then((res) => setCollections(res.data || []));
  }, [token]);

  useEffect(() => {
    if (!token || !conversationId) return;
    queryAPI.getConversation(token, conversationId).then((res) => {
      const conv = res.data;
      setCurrentConvId(conv.id);
      setMessages(
        conv.messages.map((m: any) => ({
          role: m.role,
          content: m.content,
          sources: m.sources || undefined,
        }))
      );
      if (conv.collection_ids?.length) {
        setSelectedCollections(conv.collection_ids);
      }
    });
  }, [token, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const toggleCollection = (id: string) => {
    setSelectedCollections((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleSources = (index: number) => {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !token || loading) return;

    const question = input.trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "inherit";
    
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    try {
      const res = await queryAPI.ask(token, {
        question,
        collection_ids: selectedCollections.length ? selectedCollections : undefined,
        conversation_id: currentConvId || undefined,
      });

      if (!currentConvId) {
        setCurrentConvId(res.conversation_id);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.answer,
          sources: res.sources,
          query_time_ms: res.query_time_ms,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${err.message || "Failed to get answer"}. Make sure the backend is running and Ollama is available.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Context:</span>
          <div className="flex items-center gap-1.5">
            {collections.length === 0 ? (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">No collections</span>
            ) : (
              <div className="flex gap-1.5 overflow-x-auto max-w-[400px] scrollbar-hide">
                {collections.map((col: any) => (
                  <button
                    key={col.id}
                    onClick={() => toggleCollection(col.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                      selectedCollections.includes(col.id)
                        ? "bg-primary/10 text-primary hover:bg-primary/15"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    )}
                  >
                    {col.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <button className="p-2 hover:bg-secondary rounded-md transition-colors" title="Share">
            <Share2 size={16} />
          </button>
          <button className="p-2 hover:bg-secondary rounded-md transition-colors" title="Settings">
            <PanelRight size={16} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
        <div className="max-w-3xl mx-auto space-y-8">
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-sm">
                <Sparkles size={32} />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3 tracking-tight">
                How can I help you today?
              </h2>
              <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
                Upload documents to your collections to ask specific questions, or just start chatting with me directly.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {[
                  "Summarize the uploaded marketing plan",
                  "What are the key takeaways from the report?",
                  "Explain the technical architecture",
                  "Draft an email based on these notes"
                ].map((suggestion, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      setInput(suggestion);
                      // Optional: auto-submit
                    }}
                    className="text-sm text-left p-3 rounded-lg border border-border bg-card hover:bg-secondary hover:border-secondary-foreground/20 transition-all text-muted-foreground hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex gap-4 group",
                  msg.role === "user" ? "flex-row-reverse" : ""
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1 shadow-sm",
                  msg.role === "assistant" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary text-secondary-foreground"
                )}>
                  {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
                </div>

                {/* Content */}
                <div className={cn(
                  "flex-1 max-w-[85%]",
                  msg.role === "user" ? "text-right" : "text-left"
                )}>
                  <div className={cn(
                    "flex items-center gap-2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}>
                    <span className="text-xs font-semibold text-foreground">
                      {msg.role === "assistant" ? "RAG AI" : "You"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className={cn(
                    "rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border border-border text-card-foreground rounded-tl-sm"
                  )}>
                    {msg.role === "assistant" ? (
                      <div className="prose-chat">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 ml-1"
                    >
                      <button
                        onClick={() => toggleSources(idx)}
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors bg-secondary/50 px-2 py-1 rounded-md"
                      >
                        <FileText size={12} />
                        {msg.sources.length} source{msg.sources.length > 1 ? "s" : ""} used
                        {expandedSources.has(idx) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      <AnimatePresence>
                        {expandedSources.has(idx) && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 space-y-2 overflow-hidden"
                          >
                            {msg.sources.map((source, sIdx) => (
                              <div
                                key={sIdx}
                                className="rounded-lg border border-border bg-card/50 p-3 text-xs hover:border-primary/20 transition-colors"
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                                    <FileText size={10} className="text-muted-foreground" />
                                    {source.document_name}
                                  </span>
                                  <span className="text-muted-foreground bg-secondary px-1.5 py-0.5 rounded text-[10px]">
                                    {(source.relevance_score * 100).toFixed(0)}% match
                                  </span>
                                </div>
                                <p className="text-muted-foreground line-clamp-2 leading-relaxed bg-muted/30 p-2 rounded border border-border/50 font-mono text-[10px]">
                                  "{source.content}"
                                </p>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                  
                  {/* Actions Row */}
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors" title="Copy">
                        <Share2 size={12} />
                      </button>
                      <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors" title="Regenerate">
                        <RefreshCw size={12} />
                      </button>
                      {msg.query_time_ms && (
                         <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
                           <Clock size={10} /> {(msg.query_time_ms / 1000).toFixed(1)}s
                         </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
            >
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
                <Bot size={16} />
              </div>
              <div className="bg-card border border-border rounded-2xl px-5 py-4 shadow-sm">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Loader2 size={16} className="animate-spin text-primary" />
                  <span className="animate-pulse">Reasoning...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background/80 backdrop-blur-sm border-t border-border z-10">
        <div className="max-w-3xl mx-auto relative">
          <div className="relative flex items-end gap-2 bg-card border border-border rounded-xl shadow-sm transition-all p-2">
            <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors shrink-0 h-9 w-9 flex items-center justify-center self-end mb-0.5">
              <Sparkles size={18} />
            </button>
            
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="w-full bg-transparent border-none focus:ring-0 outline-none resize-none max-h-[200px] min-h-[36px] py-1.5 text-sm placeholder:text-muted-foreground"
              rows={1}
              disabled={loading}
            />
            
            <button
              onClick={() => handleSubmit()}
              disabled={loading || !input.trim()}
              className={cn(
                "p-2 rounded-lg transition-all shrink-0 h-9 w-9 flex items-center justify-center self-end mb-0.5",
                input.trim() 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" 
                  : "bg-secondary text-muted-foreground hover:text-foreground cursor-not-allowed"
              )}
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            AI can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
}
