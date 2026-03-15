"use client";

// ── /dashboard ────────────────────────────────────────────────
// Loads the Locaiq main app (migrated from JSX artifact)
// Protected route — redirects to / if not authenticated

import { useEffect, useState } from "react";
import { getSession } from "@/lib/auth";
import { useRouter } from "next/navigation";

// Import the main app components
// (copy the component functions from GBPAuditorPro_v25.jsx here
//  during migration, splitting into logical component files)
// For now, this shows how the page structure works

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getSession().then((s) => {
      if (!s) {
        router.push("/"); // Redirect to login if not authenticated
      } else {
        setSession(s);
      }
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#050a14",
        fontFamily: "system-ui", color: "#64748b", fontSize: 14
      }}>
        Loading Locaiq...
      </div>
    );
  }

  if (!session) return null;

  // TODO: Replace with GBPAuditorPro component once migrated from JSX
  // import GBPAuditorPro from "@/components/GBPAuditorPro"
  // return <GBPAuditorPro user={session.user} />

  return (
    <div style={{ color: "white", padding: 40, fontFamily: "system-ui" }}>
      <h1>Dashboard — {session.user.email}</h1>
      <p>Migrate GBPAuditorPro_v25.jsx components here.</p>
    </div>
  );
}
