"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppShell from "@/components/app-shell";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FDFAF6]">
        <div className="text-center">
          <div className="text-5xl mb-4">🎉</div>
          <p className="text-stone-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <AppShell>{children}</AppShell>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TooltipProvider>
        <AuthGate>{children}</AuthGate>
      </TooltipProvider>
    </AuthProvider>
  );
}
