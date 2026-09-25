"use server";

// كتابة الفئات (إضافة / تعديل / حذف). للمدير فقط.

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/session";

export async function createCategory(name: string) {
  const access = await requireAuth();
  if (!access.success) return access;

  try {
    if (!name || name.trim().length === 0) {
      return { success: false, error: "اسم الفئة مطلوب" } as const;
    }

    const existing = await prisma.category.findUnique({ where: { name: name.trim() } });
    if (existing) {
      return { success: false, error: "هذي الفئة موجودة مسبقاً" } as const;
    }

    const category = await prisma.category.create({
      data: { name: name.trim() },
    });

    revalidatePath("/categories");
    return { success: true, data: category } as const;
  } catch {
    return { success: false, error: "فشل إنشاء الفئة" } as const;
  }
}

export async function updateCategory(id: string, name: string) {
  const access = await requireAuth();
  if (!access.success) return access;

  try {
    if (!name || name.trim().length === 0) {
      return { success: false, error: "اسم الفئة مطلوب" } as const;
    }

    const duplicate = await prisma.category.findFirst({
      where: { name: name.trim(), NOT: { id } },
    });
    if (duplicate) {
      return { success: false, error: "هذي الفئة موجودة مسبقاً" } as const;
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name: name.trim() },
    });

    revalidatePath("/categories");
    return { success: true, data: category } as const;
  } catch {
    return { success: false, error: "فشل تعديل الفئة" } as const;
  }
}

export async function deleteCategory(id: string) {
  const access = await requireAuth();
  if (!access.success) return access;

  try {
    const medicinesCount = await prisma.medicine.count({
      where: { categoryId: id },
    });

    if (medicinesCount > 0) {
      return {
        success: false,
        error: `ماكدر تحذف هذي الفئة، بيها ${medicinesCount} دواء مرتبط بيها`,
      } as const;
    }

    await prisma.category.delete({ where: { id } });
    revalidatePath("/categories");
    return { success: true, data: undefined } as const;
  } catch {
    return { success: false, error: "فشل حذف الفئة" } as const;
  }
}
