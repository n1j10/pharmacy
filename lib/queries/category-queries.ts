"use server";

// قراءة الفئات فقط. الصفحات تستدعي هذه الدوال، وPrisma يجلب البيانات مباشرة.

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/types";

export async function getCategories(): Promise<
  ActionResult<Awaited<ReturnType<typeof prisma.category.findMany<{ include: { _count: { select: { medicines: true } } } }>>>>
> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { medicines: true } },
      },
    });
    return { success: true, data: categories };
  } catch {
    return { success: false, error: "فشل جلب الفئات" };
  }
}

export async function getCategoryById(id: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { medicines: true },
    });

    if (!category) {
      return { success: false, error: "الفئة غير موجودة" } as const;
    }

    return { success: true, data: category } as const;
  } catch {
    return { success: false, error: "فشل جلب الفئة" } as const;
  }
}
