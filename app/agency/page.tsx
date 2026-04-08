"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/zenith/contexts/UserContext";
import { CLIENTS } from "@/components/zenith/constants/clients";
import { AgencyDashboard } from "@/components/zenith/auth";

async function gbpApi(action: string, params: Record<string, string> = {}) {
  const query = new URLSearchParams({ action, ...params });
  const res = await fetch(`/api/gbp?${query.toString()}`);
  const data = await res.json();
  if (!res.ok) throw { status: res.status, code: data.code, message: data.error };
  return data;
}

export default function AgencyPage() {
  const { user, setSelectedClient, setClients, loading, isDemo } = useUser();
  const router = useRouter();
  const [realClients, setRealClients] = useState<any[] | null>(null);
  const [loadingClients, setLoadingClients] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  // Load real GBP data
  useEffect(() => {
    if (!user || isDemo) {
      setLoadingClients(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        // 1. Fetch accounts
        const accountsData = await gbpApi("accounts");
        const accounts = accountsData.accounts || [];

        if (accounts.length === 0) {
          setLoadingClients(false);
          return;
        }

        // 2. For each account, fetch locations and profiles
        const allClients: any[] = [];
        for (const account of accounts) {
          const accountId = account.name?.split("/").pop();
          if (!accountId) continue;

          try {
            const locData = await gbpApi("locations", { accountId });
            const locations = locData.locations || [];

            for (const loc of locations) {
              if (cancelled) return;
              try {
                const profileData = await gbpApi("profile", {
                  accountId,
                  locationId: loc.id,
                });
                if (profileData.client) {
                  allClients.push(profileData.client);
                }
              } catch {
                // Skip failed locations
              }
            }
          } catch {
            // Skip failed accounts
          }
        }

        if (!cancelled && allClients.length > 0) {
          setRealClients(allClients);
          setClients?.(allClients);
        }
      } catch (e: any) {
        if (e.code === "NO_GOOGLE_AUTH") {
          setIsConnected(false);
        } else {
          setError(e.message || "Failed to load GBP data");
        }
      } finally {
        if (!cancelled) setLoadingClients(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, isDemo]);

  const handleConnectGoogle = async () => {
    try {
      setError(null);
      const res = await fetch("/api/gbp/connect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.url) window.location.href = data.url;
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading || !user) return null;

  const profiles = realClients || CLIENTS;

  return (
    <AgencyDashboard
      profiles={profiles}
      isConnected={isConnected}
      isLoading={loadingClients}
      onConnectGoogle={handleConnectGoogle}
      error={error}
      onSelectProfile={(p) => {
        setSelectedClient(p);
        router.push("/dashboard");
      }}
    />
  );
}
