"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Package,
  Users,
  Settings,
  PanelLeftClose,
  Menu,
  LogOut,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/budgets", label: "Orcamentos", icon: FileText },
  { href: "/catalog", label: "Catalogo", icon: Package },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/settings", label: "Configuracoes", icon: Settings },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/budgets": "Orcamentos",
  "/catalog": "Catalogo",
  "/clients": "Clientes",
  "/settings": "Configuracoes",
};

export default function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const title =
    pageTitles[pathname] ||
    (pathname.startsWith("/budgets/") ? "Editor de Orcamento" : "FestHub");
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col bg-[#1C1917] text-white shrink-0 overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-16 shrink-0">
          <span className="text-2xl">🎉</span>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-[family-name:var(--font-playfair)] text-xl font-bold text-amber-400"
              >
                FestHub
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <Separator className="bg-white/10" />

        {/* New Budget button */}
        <div className="px-3 mt-4">
          <Button
            onClick={() => router.push("/budgets")}
            className="w-full text-white font-semibold"
            style={{
              background: "linear-gradient(135deg, #FBBF24, #D97706)",
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            {!collapsed && "Novo Orcamento"}
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 mt-4 space-y-1">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-amber-600/20 text-amber-400"
                    : "text-stone-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.href === "/budgets" && active && (
                  <Badge
                    variant="secondary"
                    className="ml-auto bg-amber-600/30 text-amber-400 text-xs"
                  >
                    !
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User area */}
        <div className="px-3 pb-4 space-y-2">
          <Separator className="bg-white/10" />
          <div className="flex items-center gap-2 px-2 py-2">
            <Avatar className="h-8 w-8 bg-amber-600 shrink-0">
              <AvatarFallback className="bg-amber-600 text-white text-xs">
                {user?.name?.charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.name || "Admin"}
                </p>
                <p className="text-xs text-stone-400 truncate">
                  {user?.email}
                </p>
              </div>
            )}
            <button
              onClick={logout}
              title="Sair"
              className="text-stone-400 hover:text-white shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-[#E7E5E4] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-stone-500 hover:text-stone-800"
            >
              {collapsed ? (
                <Menu className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </button>
            <h1 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-stone-800">
              {title}
            </h1>
          </div>
          <span className="text-sm text-stone-500 capitalize">{today}</span>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
