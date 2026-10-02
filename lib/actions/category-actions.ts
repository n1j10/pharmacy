"use server";

// الفئات (Categories): إضافة / تعديل / حذف.

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/session";
import { ok, fail } from "./helpers";

export async function createCategory(name: string) {
  const access = await requireAuth();
  if (!access.success) return access;

  const categoryName = name?.trim();
  if (!categoryName) {
    return fail("اسم الفئة مطلوب");
  }

  try {
    const exists = await prisma.category.findUnique({ where: { name: categoryName } });
    if (exists) {
      return fail("هذي الفئة موجودة مسبقاً");
    }

    const category = await prisma.category.create({
      data: { name: categoryName },
    });

    revalidatePath("/categories");
    return ok(category);
  } catch {
    return fail("فشل إنشاء الفئة");
  }
}

export async function updateCategory(id: string, name: string) {
  const access = await requireAuth();
  if (!access.success) return access;

  const categoryName = name?.trim();
  if (!categoryName) {
    return fail("اسم الفئة مطلوب");
  }

  try {
    // نتأكد ماكو فئة ثانية (غير هذي) بنفس الاسم
    const duplicate = await prisma.category.findFirst({
      where: { name: categoryName, id: { not: id } },
    });
    if (duplicate) {
      return fail("هذي الفئة موجودة مسبقاً");
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name: categoryName },
    });

    revalidatePath("/categories");
    return ok(category);
  } catch {
    return fail("فشل تعديل الفئة");
  }
}

export async function deleteCategory(id: string) {
  const access = await requireAuth();
  if (!access.success) return access;

  try {
    // ماكدر نحذف فئة بيها أدوية
    const medicinesCount = await prisma.medicine.count({ where: { categoryId: id } });
    if (medicinesCount > 0) {
      return fail(`ماكدر تحذف هذي الفئة، بيها ${medicinesCount} دواء مرتبط بيها`);
    }

    await prisma.category.delete({ where: { id } });

    revalidatePath("/categories");
    return ok();
  } catch {
    return fail("فشل حذف الفئة");
  }
}
