"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  FileText,
  GitBranch,
  Package,
  FileSignature,
  Truck,
} from "lucide-react";
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import api from "@/lib/api";

interface SearchResult {
  type: string;
  id: number;
  name: string;
  subtitle: string;
}

const typeConfig: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; href: (id: number) => string }
> = {
  client: { label: "Clientes", icon: Users, href: () => "/clients" },
  budget: { label: "Orçamentos", icon: FileText, href: (id) => `/budgets/${id}` },
  lead: { label: "Leads", icon: GitBranch, href: () => "/pipeline" },
  catalog: { label: "Catálogo", icon: Package, href: () => "/catalog" },
  contract: { label: "Contratos", icon: FileSignature, href: () => "/contratos" },
  supplier: { label: "Fornecedores", icon: Truck, href: () => "/suppliers" },
};

export default function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const search = useCallback((value: string) => {
    setQuery(value);
    if (value.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      api
        .get(`/api/search?q=${encodeURIComponent(value)}`)
        .then((r) => setResults(r.data))
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  const handleSelect = (result: SearchResult) => {
    const cfg = typeConfig[result.type];
    if (cfg) {
      router.push(cfg.href(result.id));
    }
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E2E4EE] text-sm text-[#7880A0] hover:bg-[#F5F6FA] transition-colors"
      >
        Buscar...
        <kbd className="hidden md:inline-flex h-5 items-center gap-0.5 rounded border border-[#E2E4EE] bg-[#FAFBFE] px-1.5 text-[10px] font-medium text-[#7880A0]">
          ⌘K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Busca Global"
        description="Busque clientes, orçamentos, leads e mais"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar clientes, orçamentos, leads..."
            value={query}
            onValueChange={search}
          />
          <CommandList>
            {query.length >= 2 && results.length === 0 && (
              <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            )}
            {Object.entries(grouped).map(([type, items]) => {
              const cfg = typeConfig[type];
              if (!cfg) return null;
              return (
                <CommandGroup key={type} heading={cfg.label}>
                  {items.map((item) => {
                    const Icon = cfg.icon;
                    return (
                      <CommandItem
                        key={`${type}-${item.id}`}
                        onSelect={() => handleSelect(item)}
                        className="cursor-pointer"
                      >
                        <Icon className="h-4 w-4 text-[#7880A0] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1E2247] truncate">
                            {item.name}
                          </p>
                          {item.subtitle && (
                            <p className="text-xs text-[#7880A0] truncate">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
