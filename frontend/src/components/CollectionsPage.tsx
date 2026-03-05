"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { collectionsAPI } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  FolderOpen,
  FileText,
  Plus,
  Search,
  Clock,
  ArrowRight,
  MoreVertical,
  Trash2,
  Edit2
} from "lucide-react";

interface CollectionsPageProps {
  onViewChange: (view: string, id?: string) => void;
}

export default function CollectionsPage({ onViewChange }: CollectionsPageProps) {
  const { token } = useAuth();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!token) return;
    collectionsAPI.list(token)
      .then(res => {
        setCollections(res.data || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newCollectionName.trim()) return;
    setCreating(true);
    try {
      const res = await collectionsAPI.create(token, {
        name: newCollectionName.trim(),
        description: newCollectionDesc.trim() || undefined
      });
      setCollections([res.data, ...collections]);
      setShowCreateModal(false);
      setNewCollectionName("");
      setNewCollectionDesc("");
      // Optional: navigate directly to the new collection
      // onViewChange("collection", res.data.id);
    } catch (err) {
      console.error("Failed to create collection:", err);
    } finally {
      setCreating(false);
    }
  };

  const filteredCollections = collections.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-background to-secondary/20 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Collections</h1>
            <p className="text-muted-foreground mt-1">
              Organize your documents into knowledge bases.
            </p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            New Collection
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search collections..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card w-full max-w-md p-6 rounded-2xl shadow-xl border border-border"
            >
              <h2 className="text-xl font-semibold mb-4">Create New Collection</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Name</label>
                  <input 
                    type="text" 
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    placeholder="e.g. Q1 Financial Reports"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Description (optional)</label>
                  <textarea 
                    value={newCollectionDesc}
                    onChange={(e) => setNewCollectionDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    placeholder="What is this collection about?"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button 
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={creating || !newCollectionName.trim()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Create Collection"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Grid */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredCollections.map((col) => (
            <motion.div
              key={col.id}
              variants={item}
              onClick={() => onViewChange("collection", col.id)}
              className="group bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={20} className="text-primary" />
              </div>

              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FolderOpen size={24} />
              </div>
              
              <h3 className="text-lg font-semibold text-foreground mb-1 pr-6">{col.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-4">
                {col.description || "No description provided."}
              </p>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
                <span className="flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-md">
                  <FileText size={12} /> {col.document_count} docs
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {formatDate(col.created_at)}
                </span>
              </div>
            </motion.div>
          ))}
          
          {/* Empty State */}
          {filteredCollections.length === 0 && !loading && (
             <div className="col-span-full text-center py-20 border-2 border-dashed border-border rounded-2xl">
               <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                 <FolderOpen size={32} className="text-muted-foreground/50" />
               </div>
               <h3 className="text-lg font-medium text-foreground">No collections found</h3>
               <p className="text-muted-foreground mt-1 mb-6">Create a new collection to get started.</p>
               <button 
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
              >
                Create Collection
              </button>
             </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
