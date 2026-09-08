import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Prisma 7: يتطلب driver adapter بدلاً من datasourceUrl
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });

  return new PrismaClient({
    adapter,
    // اختياري: يطبع الاستعلامات بالـ console وقت التطوير (مفيد للتتبع)
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// نخزن النسخة بـ globalThis بس وقت التطوير (مو بالإنتاج، لأن كل نشر جديد = عملية جديدة أصلاً)
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

