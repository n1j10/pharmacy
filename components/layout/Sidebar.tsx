"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

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
      <button
        type="button"
        className="mobile-menu-btn"
        onClick={() => setOpen(true)}
        aria-label="فتح القائمة"
      >
        ☰
      </button>

      {open && (
        <div className="sidebar-overlay" onClick={() => setOpen(false)} />
      )}

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">💊</div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">PharmaSys</span>
            <span className="sidebar-logo-sub">نظام إدارة الصيدلية</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">القائمة الرئيسية</span>

          {navItems
            .filter((item) => !item.adminOnly || role === "ADMIN")
            .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`nav-item ${isActive(item.href) ? "active" : ""}`}
              style={
                item.accent && !isActive(item.href)
                  ? {
                      background:
                        "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(99,102,241,0.08))",
                      border: "1px solid rgba(14,165,233,0.2)",
                      color: "#38bdf8",
                    }
                  : {}
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          {session?.user && (
            <div style={{ marginBottom: "0.75rem" }}>
              <div className="user-chip">
                <div className="avatar">
                  {(session.user.name || "م").charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#e2e8f0",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {session.user.name || "مستخدم"}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                    {roleLabel}
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="btn btn-secondary btn-full"
            style={{ fontSize: "0.825rem" }}
          >
            <span>🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
