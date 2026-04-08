"use client";
import { useState, useEffect } from "react";
import { CLIENTS } from "./zenith/constants/clients";
import { AuthScreen, AgencyDashboard } from "./zenith/auth";
import Dashboard from "./zenith/Dashboard";
import { getSession, getUser, signOut } from "@/lib/auth";

export default function ZenithPro() {
  const [screen, setScreen] = useState("loading");
  const [user, setUser] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  // Check for existing Supabase session on mount
  useEffect(() => {
    const checkSession = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
        setScreen("auth");
        return;
      }
      try {
        const session = await getSession();
        if (session) {
          const supaUser = await getUser();
          setUser({
            name: supaUser?.user_metadata?.full_name || supaUser?.email?.split("@")[0] || "User",
            email: supaUser?.email || "",
            id: supaUser?.id,
            via: "session",
          });
          setScreen("dashboard");
        } else {
          setScreen("auth");
        }
      } catch {
        setScreen("auth");
      }
    };
    checkSession();
  }, []);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setSelectedClient(null);
    setScreen("auth");
  };

  if (screen === "loading") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#050a14", color: "#e2e8f0", fontFamily: "'Space Grotesk', system-ui" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 38, fontWeight: 900, fontFamily: "var(--font-zenith), 'Orbitron', sans-serif", letterSpacing: 6, background: "linear-gradient(135deg,#3b82f6,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 12 }}>ZENITH</div>
        <div style={{ fontSize: 13, color: "#64748b" }}>Carregando...</div>
      </div>
    </div>
  );

  if (screen === "auth") return <AuthScreen onLogin={u => { setUser(u); setScreen("dashboard"); }} />;
  if (screen === "agency") return (
    <AgencyDashboard
      profiles={CLIENTS}
      onSelectProfile={p => { setSelectedClient(p); setScreen("dashboard"); }}
    />
  );
  return <Dashboard user={{ ...user, selectedClient }} onBack={() => setScreen("agency")} onLogout={handleLogout} />;
}
