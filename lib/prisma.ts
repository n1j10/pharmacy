import { PrismaClient } from "@prisma/client";

// نستخدم globalThis عشان نخزن فيه نسخة واحدة من PrismaClient
// هذا يمنع إنشاء اتصالات جديدة بكل hot reload وقت التطوير
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // اختياري: يطبع الاستعلامات بالـ console وقت التطوير (مفيد للتتبع)
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// نخزن النسخة بـ globalThis بس وقت التطوير (مو بالإنتاج، لأن كل نشر جديد = عملية جديدة أصلاً)
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

