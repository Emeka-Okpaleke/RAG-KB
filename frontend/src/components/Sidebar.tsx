"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { collectionsAPI, queryAPI } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  FolderOpen,
  MessageSquare,
  Plus,
  LogOut,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  X,
  Search,
  Settings,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

import { ModeToggle } from "@/components/ModeToggle";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string, id?: string) => void;
}

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { user, token, logout } = useAuth();
  const [collections, setCollections] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [collectionsOpen, setCollectionsOpen] = useState(true);
  const [conversationsOpen, setConversationsOpen] = useState(true);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    if (!token) return;
    try {
      const [colRes, convRes] = await Promise.all([
        collectionsAPI.list(token),
        queryAPI.listConversations(token),
      ]);
      setCollections(colRes.data || []);
      setConversations(convRes.data || []);
    } catch (err) {
      console.error("Failed to fetch sidebar data:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newCollectionName.trim()) return;
    setCreating(true);
    try {
      const res = await collectionsAPI.create(token, {
        name: newCollectionName.trim(),
        description: newCollectionDesc.trim() || undefined,
      });
      setCollections((prev) => [res.data, ...prev]);
      setNewCollectionName("");
      setNewCollectionDesc("");
      setShowNewCollection(false);
      onViewChange("collection", res.data.id);
    } catch (err) {
      console.error("Failed to create collection:", err);
    } finally {
      setCreating(false);
    }
  };

  const NavItem = ({ 
    icon: Icon, 
    label, 
    active, 
    onClick, 
    count 
  }: { 
    icon: any, 
    label: string, 
    active?: boolean, 
    onClick: () => void,
    count?: number
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group relative",
        active 
          ? "bg-secondary text-foreground font-semibold" 
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      )}
    >
      <Icon size={18} className={cn("transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      <span className="truncate">{label}</span>
      {count !== undefined && (
        <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
          {count}
        </span>
      )}
    </button>
  );

  return (
    <aside className="w-[280px] h-screen bg-card border-r border-border flex flex-col shadow-sm z-20">
      {/* Header */}
      <div className="p-4 pt-5 pb-2">
        <div className="flex items-center gap-3 mb-6 px-1">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/20">
            <BookOpen size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground leading-none">RAG KB</h1>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium tracking-wide uppercase">Workspace</p>
          </div>
        </div>

        <div className="space-y-1">
          <NavItem 
            icon={LayoutDashboard} 
            label="Inbox / Dashboard" 
            active={activeView === "dashboard"} 
            onClick={() => onViewChange("dashboard")} 
          />
          <NavItem 
            icon={Plus} 
            label="New Thread" 
            active={activeView === "chat"} 
            onClick={() => onViewChange("chat")} 
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 space-y-6 scrollbar-thin">
        {/* Collections Section */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2 group">
            <button
              onClick={() => setCollectionsOpen(!collectionsOpen)}
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors flex items-center gap-1.5"
            >
               Collections
            </button>
            <button
              onClick={() => setShowNewCollection(true)}
              className="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100 p-1 hover:bg-secondary rounded"
              title="New Collection"
            >
              <Plus size={14} />
            </button>
          </div>

          <AnimatePresence>
            {collectionsOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-0.5"
              >
                {showNewCollection && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-secondary/30 rounded-lg border border-border mb-2"
                  >
                    <form onSubmit={handleCreateCollection} className="space-y-2">
                      <input
                        type="text"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        placeholder="Collection Name"
                        className="input-field h-8 text-xs bg-background"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={newCollectionDesc}
                        onChange={(e) => setNewCollectionDesc(e.target.value)}
                        placeholder="Description"
                        className="input-field h-8 text-xs bg-background"
                      />
                      <div className="flex gap-2 justify-end pt-1">
                         <button
                          type="button"
                          onClick={() => setShowNewCollection(false)}
                          className="text-xs px-2 py-1 text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          disabled={creating} 
                          className="bg-primary text-primary-foreground text-xs px-2.5 py-1 rounded-md font-medium hover:bg-primary/90 transition-colors"
                        >
                          {creating ? "..." : "Create"}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {collections.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => onViewChange("collection", col.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-all duration-200 group",
                      activeView === `collection-${col.id}`
                        ? "bg-secondary text-foreground font-medium"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors shrink-0" />
                    <span className="truncate flex-1 text-left">{col.name}</span>
                    <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {col.document_count}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Conversations Section */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2 group">
            <button
              onClick={() => setConversationsOpen(!conversationsOpen)}
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors flex items-center gap-1.5"
            >
               History
            </button>
          </div>

          <AnimatePresence>
            {conversationsOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-0.5"
              >
                {conversations.slice(0, 15).map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => onViewChange("conversation", conv.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-all duration-200 group",
                      activeView === `conversation-${conv.id}`
                         ? "bg-secondary text-foreground font-medium"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}
                  >
                    <MessageSquare size={14} className={cn("shrink-0", activeView === `conversation-${conv.id}` ? "text-primary" : "opacity-70")} />
                    <span className="truncate flex-1 text-left">{conv.title}</span>
                  </button>
                ))}
                {conversations.length === 0 && (
                  <div className="px-3 py-4 text-xs text-muted-foreground text-center italic">
                    No conversations yet
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-border mt-auto space-y-2">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors group cursor-pointer relative">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center text-sm font-medium shrink-0 shadow-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          
          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-card/80 backdrop-blur-sm rounded-md shadow-sm border border-border">
            <ModeToggle className="h-7 w-7" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
              className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
        
        <div className="px-2 pb-1 text-center">
            <p className="text-[10px] text-muted-foreground">
                Made by <span className="font-semibold text-foreground">Olisemeka Okpaleke</span>
            </p>
            <p className="text-[10px] text-muted-foreground opacity-70">
                olisemekaokpaleke08@gmail.com
            </p>
        </div>
      </div>
    </aside>
  );
}
