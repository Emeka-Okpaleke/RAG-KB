"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import AuthPage from "@/components/AuthPage";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import ChatView from "@/components/ChatView";
import CollectionView from "@/components/CollectionView";
import LandingPage from "@/components/LandingPage";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState("dashboard");
  const [activeId, setActiveId] = useState<string | undefined>();
  const [showAuth, setShowAuth] = useState(false);

  const handleViewChange = (view: string, id?: string) => {
    if (view === "collection" && id) {
      setActiveView(`collection-${id}`);
      setActiveId(id);
    } else if (view === "conversation" && id) {
      setActiveView(`conversation-${id}`);
      setActiveId(id);
    } else {
      setActiveView(view);
      setActiveId(undefined);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    if (showAuth) {
      return <AuthPage />;
    }
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }

  const renderMainContent = () => {
    if (activeView === "dashboard") {
      return <Dashboard />;
    }
    if (activeView === "chat") {
      return <ChatView />;
    }
    if (activeView.startsWith("collection-") && activeId) {
      return <CollectionView collectionId={activeId} key={activeId} />;
    }
    if (activeView.startsWith("conversation-") && activeId) {
      return <ChatView conversationId={activeId} key={activeId} />;
    }
    return <Dashboard />;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activeView={activeView} onViewChange={handleViewChange} />
      <main className="flex-1 overflow-hidden bg-secondary/30 relative">
        {renderMainContent()}
      </main>
    </div>
  );
}
