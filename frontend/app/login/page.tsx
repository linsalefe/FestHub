"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      toast.error("Email ou senha invalidos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFAF6]">
      <Card className="w-full max-w-md border-[#E7E5E4] shadow-lg" style={{ borderRadius: 12 }}>
        <CardHeader className="text-center pb-2">
          <div className="text-5xl mb-2">🎉</div>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-stone-800">
            FestHub
          </h1>
          <p className="text-stone-500 text-sm">
            Gestao inteligente de orcamentos
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@festhub.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ borderRadius: 8 }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ borderRadius: 8 }}
              />
            </div>
            <Button
              type="submit"
              className="w-full text-white font-semibold"
              style={{
                background: "linear-gradient(135deg, #FBBF24, #D97706)",
                borderRadius: 8,
              }}
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
