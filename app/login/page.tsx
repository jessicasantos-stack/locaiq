"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/zenith/contexts/UserContext";
import { AuthScreen } from "@/components/zenith/auth";

export default function LoginPage() {
  const { user, login, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  if (loading) return null;

  return (
    <AuthScreen
      onLogin={(u) => {
        login(u);
        router.push("/dashboard");
      }}
    />
  );
}
