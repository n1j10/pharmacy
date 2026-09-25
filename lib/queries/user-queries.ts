"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function getUsers() {
  const access = await requireAdmin();
  if (!access.success) return access;

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    return { success: true, data: users } as const;
  } catch {
    return { success: false, error: "فشل جلب الموظفين" } as const;
  }
}
