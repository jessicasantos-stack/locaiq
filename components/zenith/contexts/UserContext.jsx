"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { getSession, getUser, signOut } from "@/lib/auth";

const UserContext = createContext();

const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      if (isDemo) {
        setLoading(false);
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
        }
      } catch {
        // No session
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = (userData) => setUser(userData);

  const logout = async () => {
    if (!isDemo) await signOut();
    setUser(null);
    setSelectedClient(null);
    setClients(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout, selectedClient, setSelectedClient, clients, setClients, loading, isDemo }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
