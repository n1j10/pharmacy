"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 md:mr-64 min-h-screen flex flex-col">
        {children}
      </main>
    </>
  );
}
