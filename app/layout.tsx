import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import MainLayout from "@/components/layout/MainLayout";

export const metadata: Metadata = {
  title: "نظام إدارة الصيدلية - PharmaSys",
  description: "نظام شامل ومتطور لإدارة الأدوية والمخزون والمبيعات الصيدلانية",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
        <Providers>
          <MainLayout>{children}</MainLayout>
        </Providers>
      </body>
    </html>
  );
}
