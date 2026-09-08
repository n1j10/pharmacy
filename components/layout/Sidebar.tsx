"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const navItems = [
  { href: "/", icon: "🏠", label: "لوحة التحكم" },
  { href: "/medicines", icon: "💊", label: "الأدوية" },
  { href: "/categories", icon: "🗂️", label: "الفئات", adminOnly: true },
  { href: "/sales", icon: "🧾", label: "المبيعات" },
  { href: "/sales/new", icon: "➕", label: "بيع جديد", accent: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  if (pathname === "/login") return null;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/sales/new") return pathname === "/sales/new";
    if (href === "/sales") {
      return pathname === "/sales" || (pathname.startsWith("/sales/") && pathname !== "/sales/new");
    }
    return pathname.startsWith(href);
  };

  const role = (session?.user as { role?: string } | undefined)?.role;
  const roleLabel = role === "ADMIN" ? "مدير" : "بائع";

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 right-4 z-50 md:hidden bg-card border-border"
        onClick={() => setOpen(true)}
        aria-label="فتح القائمة"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setOpen(false)} 
        />
      )}

      <aside 
        className={cn(
          "fixed top-0 right-0 z-50 h-screen w-64 flex flex-col bg-card border-l border-border transform transition-transform duration-200 ease-in-out md:translate-x-0 overflow-y-auto",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 p-6 border-b border-border">
          <div className="text-3xl">💊</div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent leading-tight">PharmaSys</span>
            <span className="text-xs text-muted-foreground font-medium">نظام إدارة الصيدلية</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          <span className="px-3 pt-2 pb-2 text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider">
            القائمة الرئيسية
          </span>

          {navItems
            .filter((item) => !item.adminOnly || role === "ADMIN")
            .map((item) => {
              const active = isActive(item.href);
              
              let style = {};
              if (item.accent && !active) {
                style = {
                  background: "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(99,102,241,0.08))",
                  border: "1px solid rgba(14,165,233,0.2)",
                  color: "#38bdf8",
                };
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  style={style}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all relative overflow-hidden mb-1",
                    active 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <span className="text-lg w-6 text-center">{item.icon}</span>
                  <span>{item.label}</span>
                  {active && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-3/5 bg-primary rounded-l-sm shadow-[0_0_10px_rgba(14,165,233,0.6)]" />
                  )}
                </Link>
              );
          })}
        </nav>

        <div className="p-4 border-t border-border bg-black/10">
          {session?.user && (
            <div className="mb-4">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-background/30 p-2.5 text-sm text-foreground">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-white font-bold shadow-md">
                  {(session.user.name || "م").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">
                    {session.user.name || "مستخدم"}
                  </div>
                  <div className="text-[0.75rem] text-muted-foreground font-medium">
                    {roleLabel}
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button
            variant="secondary"
            className="w-full justify-start gap-3 h-10 font-bold border border-white/5 bg-white/5 hover:bg-white/10"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <span>🚪</span>
            <span>تسجيل الخروج</span>
          </Button>
        </div>
      </aside>
    </>
  );
}
