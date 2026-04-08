"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/zenith/contexts/UserContext";

export default function HomePage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [user, loading, router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#050a14", color: "#e2e8f0", fontFamily: "'Space Grotesk', system-ui" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 38, fontWeight: 900, fontFamily: "var(--font-zenith), 'Orbitron', sans-serif", letterSpacing: 6, background: "linear-gradient(135deg,#3b82f6,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 12 }}>ZENITH</div>
        <div style={{ fontSize: 13, color: "#64748b" }}>Carregando...</div>
      </div>
    </div>
  );
}
