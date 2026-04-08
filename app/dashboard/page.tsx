"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/zenith/contexts/UserContext";
import Dashboard from "@/components/zenith/Dashboard";

export default function DashboardPage() {
  const { user, selectedClient, clients, logout, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <Dashboard
      user={{ ...user, selectedClient }}
      clients={clients}
      onBack={() => router.push("/agency")}
      onLogout={() => { logout(); router.push("/login"); }}
    />
  );
}
