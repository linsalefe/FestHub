"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  GitBranch,
  FileText,
  Calendar,
  Package,
  Users,
  Truck,
  Settings,
  UserCog,
  BookOpen,
  PanelLeftClose,
  Menu,
  LogOut,
  Plus,
  DollarSign,
  FileSignature,
  BarChart3,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import NotificationBell from "@/components/notification-bell";
import SearchDialog from "@/components/search-dialog";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    group: "PRINCIPAL",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/pipeline", label: "Pipeline", icon: GitBranch },
      { href: "/budgets", label: "Orcamentos", icon: FileText },
      { href: "/financeiro", label: "Financeiro", icon: DollarSign },
      { href: "/contratos", label: "Contratos", icon: FileSignature },
      { href: "/calendar", label: "Agenda", icon: Calendar },
      { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
    ],
  },
  {
    group: "GESTÃO",
    items: [
      { href: "/catalog", label: "Catalogo", icon: Package },
      { href: "/clients", label: "Clientes", icon: Users },
      { href: "/suppliers", label: "Fornecedores", icon: Truck },
    ],
  },
  {
    group: "SISTEMA",
    items: [
      { href: "/settings", label: "Configuracoes", icon: Settings },
      { href: "/users", label: "Usuarios", icon: UserCog },
      { href: "/tutorials", label: "Tutoriais", icon: BookOpen },
    ],
  },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/pipeline": "Pipeline",
  "/budgets": "Orcamentos",
  "/financeiro": "Financeiro",
  "/contratos": "Contratos",
  "/calendar": "Agenda",
  "/relatorios": "Relatórios",
  "/catalog": "Catalogo",
  "/clients": "Clientes",
  "/suppliers": "Fornecedores",
  "/settings": "Configuracoes",
  "/users": "Usuarios",
  "/tutorials": "Tutoriais",
};

export default function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const title =
    pageTitles[pathname] ||
    (pathname.startsWith("/budgets/") ? "Editor de Orcamento" : "Île Magique");
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const sidebarContent = (isMobile: boolean) => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-16 shrink-0">
        <Image src="/logo.png" alt="Île Magique" width={32} height={32} />
        {(isMobile || !collapsed) && (
          <span className="font-[family-name:var(--font-quicksand)] text-xl font-bold text-[#4A5BA8]">
            Île Magique
          </span>
        )}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto text-[#7880A0] hover:text-[#1E2247]"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="h-px bg-[#E2E4EE]" />

      {/* New Budget button */}
      <div className="px-3 mt-4">
        <Button
          onClick={() => router.push("/budgets")}
          className="w-full text-white font-semibold"
          style={{
            background: "linear-gradient(135deg, #E8A030, #D07840)",
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          {(isMobile || !collapsed) && "Novo Orcamento"}
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-2 space-y-0.5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.group}>
            {(isMobile || !collapsed) && (
              <p className="text-[10px] uppercase tracking-wider text-[#7880A0] px-3 mt-4 mb-1">
                {group.group}
              </p>
            )}
            {!isMobile && collapsed && <div className="mt-3" />}
            {group.items.map((item) => {
              const active =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={!isMobile && collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-[#EEF0F8] text-[#4A5BA8] font-bold"
                      : "text-[#7880A0] hover:text-[#4A5BA8] hover:bg-[#F5F6FA]"
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {(isMobile || !collapsed) && <span>{item.label}</span>}
                  {(isMobile || !collapsed) && item.href === "/budgets" && active && (
                    <Badge
                      variant="secondary"
                      className="ml-auto bg-[#4A5BA8] text-white text-xs"
                    >
                      !
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User area */}
      <div className="px-3 pb-4 space-y-2">
        <div className="h-px bg-[#E2E4EE]" />
        <div className="flex items-center gap-2 px-2 py-2">
          <Avatar className="h-8 w-8 bg-[#EEF0F8] shrink-0">
            <AvatarFallback className="bg-[#EEF0F8] text-[#4A5BA8] text-xs font-bold">
              {user?.name?.charAt(0) || "A"}
            </AvatarFallback>
          </Avatar>
          {(isMobile || !collapsed) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1E2247] truncate">
                {user?.name || "Admin"}
              </p>
              <p className="text-xs text-[#7880A0] truncate">
                {user?.email}
              </p>
            </div>
          )}
          <button
            onClick={logout}
            title="Sair"
            className="text-[#7880A0] hover:text-[#4A5BA8] shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.2 }}
        className="hidden md:flex flex-col bg-white border-r border-[#E2E4EE] shrink-0 overflow-hidden"
      >
        {sidebarContent(false)}
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-y-0 left-0 w-[280px] flex flex-col bg-white z-50 md:hidden shadow-xl"
            >
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-[#E2E4EE] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  setMobileOpen(!mobileOpen);
                } else {
                  setCollapsed(!collapsed);
                }
              }}
              className="text-[#7880A0] hover:text-[#1E2247]"
            >
              {collapsed && !mobileOpen ? (
                <Menu className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5 hidden md:block" />
              )}
              <Menu className="h-5 w-5 md:hidden" />
            </button>
            <h1 className="font-[family-name:var(--font-quicksand)] text-lg sm:text-xl font-bold text-[#1E2247]">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <SearchDialog />
            <NotificationBell />
            <span className="hidden lg:block text-sm text-[#7880A0] capitalize">{today}</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
