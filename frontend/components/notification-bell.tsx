"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, AlertTriangle, XCircle, Info } from "lucide-react";
import api from "@/lib/api";

interface Notification {
  type: "warning" | "danger" | "info";
  message: string;
  link: string;
  created_at: string;
}

const typeConfig = {
  warning: { icon: AlertTriangle, color: "text-[#E8A030]", bg: "bg-[#FFF8EC]" },
  danger: { icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
  info: { icon: Info, color: "text-[#4A5BA8]", bg: "bg-[#EEF0F8]" },
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = () => {
    api
      .get("/api/notifications")
      .then((r) => setNotifications(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const count = notifications.length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-[#7880A0] hover:text-[#1E2247] hover:bg-[#F5F6FA] transition-colors"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-[#E2E4EE] bg-white shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E4EE]">
            <p className="font-semibold text-[#1E2247] text-sm">Notificações</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-[#7880A0] text-sm">
                Tudo tranquilo por aqui!
              </div>
            ) : (
              notifications.map((n, i) => {
                const cfg = typeConfig[n.type] || typeConfig.info;
                const Icon = cfg.icon;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      router.push(n.link);
                      setOpen(false);
                    }}
                    className="flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-[#FAFBFE] transition-colors border-b border-[#E2E4EE] last:border-0"
                  >
                    <div className={`mt-0.5 p-1.5 rounded-lg ${cfg.bg} shrink-0`}>
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                    </div>
                    <p className="text-sm text-[#1E2247] leading-snug">{n.message}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
