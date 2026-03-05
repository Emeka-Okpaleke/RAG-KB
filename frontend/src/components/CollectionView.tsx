"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { collectionsAPI, documentsAPI } from "@/lib/api";
import { formatFileSize, formatDate } from "@/lib/utils";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  FolderOpen,
  File,
  X,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CollectionViewProps {
  collectionId: string;
}

export default function CollectionView({ collectionId }: CollectionViewProps) {
  const { token } = useAuth();
  const [collection, setCollection] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCollection = useCallback(async () => {
    if (!token) return;
    try {
      const res = await collectionsAPI.get(token, collectionId);
      setCollection(res.data);
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error("Failed to fetch collection:", err);
    } finally {
      setLoading(false);
    }
  }, [token, collectionId]);

  useEffect(() => {
    fetchCollection();
    const interval = setInterval(() => {
      fetchCollection();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchCollection]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!token) return;
      setUploadError("");
      setUploading(true);

      try {
        for (const file of acceptedFiles) {
          await documentsAPI.upload(token, file, collectionId);
        }
        setTimeout(fetchCollection, 1000);
      } catch (err: any) {
        setUploadError(err.message || "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [token, collectionId, fetchCollection]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
    },
    maxSize: 50 * 1024 * 1024,
  });

  const handleDelete = async (docId: string) => {
    if (!token) return;
    if (!confirm("Delete this document? This will also remove it from the vector store.")) return;
    try {
      await documentsAPI.delete(token, docId);
      fetchCollection();
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle size={14} className="text-green-500" />;
      case "processing":
        return <Loader2 size={14} className="text-amber-500 animate-spin" />;
      case "pending":
        return <Clock size={14} className="text-blue-500" />;
      case "failed":
        return <AlertCircle size={14} className="text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-50 text-green-700 border-green-200";
      case "processing":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "pending":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "failed":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-secondary text-muted-foreground border-border";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-background">
        <FolderOpen size={48} className="mb-4 opacity-20" />
        <p>Collection not found</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background p-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto space-y-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                <FolderOpen size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">{collection.name}</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="font-medium text-foreground">{documents.length}</span> documents
                  <span>•</span>
                  <span>Created {formatDate(collection.created_at)}</span>
                </div>
              </div>
            </div>
            {collection.description && (
              <p className="text-sm text-muted-foreground max-w-2xl mt-2 leading-relaxed">
                {collection.description}
              </p>
            )}
          </div>
          <button
            onClick={() => fetchCollection()}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Upload Zone */}
        <div
          {...getRootProps()}
          className={cn(
            "group relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 overflow-hidden",
            isDragActive
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border hover:border-primary/50 hover:bg-secondary/30"
          )}
        >
          <input {...getInputProps()} />
          
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-sm",
              isDragActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
            )}>
              {uploading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <Upload size={24} />
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {uploading ? "Uploading..." : isDragActive ? "Drop files now" : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, DOCX, TXT, MD (max 50MB)
              </p>
            </div>
          </div>

          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} 
          />
        </div>

        {uploadError && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20"
          >
            <AlertCircle size={16} className="shrink-0" />
            {uploadError}
          </motion.div>
        )}

        {/* Documents List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            Documents
            <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {documents.length}
            </span>
          </h2>

          <AnimatePresence>
            {documents.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl bg-card/50"
              >
                <div className="w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                  <File size={24} className="text-muted-foreground opacity-50" />
                </div>
                <h3 className="text-sm font-medium text-foreground">No documents yet</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Upload documents to context-enable your AI assistant.
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {documents.map((doc: any) => (
                  <motion.div
                    key={doc.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group bg-card border border-border rounded-lg p-4 hover:border-primary/20 hover:shadow-sm transition-all relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-medium text-foreground truncate pr-4">
                            {doc.name}
                          </p>
                          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="uppercase tracking-wider font-semibold text-[10px] bg-secondary px-1.5 rounded-sm">
                              {doc.file_type}
                            </span>
                            <span>{formatFileSize(doc.file_size)}</span>
                            <span>•</span>
                            <span>{formatDate(doc.created_at)}</span>
                            {doc.chunk_count > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-primary/80">{doc.chunk_count} chunks</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border uppercase tracking-wide",
                          getStatusColor(doc.status)
                        )}>
                          {getStatusIcon(doc.status)}
                          {doc.status}
                        </div>
                        
                        <div className="border-l border-border h-8 mx-1 hidden sm:block" />
                        
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Delete document"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {doc.error_message && (
                      <div className="mt-3 text-xs text-destructive bg-destructive/5 p-2 rounded-md border border-destructive/10 flex items-start gap-2">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        {doc.error_message}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
