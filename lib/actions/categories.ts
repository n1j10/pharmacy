"use server";
import type { ActionResult } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { categorySchema, validateFuctionSchema } from "@/lib/schema";
import { getAuthUser } from "./user";
import { runAction, orRedirect, contains } from "./helpers";

// هل في فئة ثانية بنفس الاسم؟ (exceptId = الفئة الحالية أثناء التعديل)
const isNameUsed = async (name: string, exceptId?: string) => {
  const category = await prisma.category.findFirst({
    where: { name, id: { not: exceptId } },
  });
  return category !== null;
};

// كل الفئات مع عدد الأدوية بكل فئة (مرتبة بالاسم). فلتر اختياري: بحث بالاسم.
export async function fetchCategories(search?: string) {
  await getAuthUser();

  return prisma.category.findMany({
    where: { name: search ? contains(search) : undefined },
    include: { _count: { select: { medicines: true } } },
    orderBy: { name: "asc" },
  });
}

// فئة وحدة. إذا مو موجودة يروح لصفحة الفئات.
export async function fetchSingleCategory(id: string) {
  await getAuthUser();

  return orRedirect(await prisma.category.findUnique({ where: { id } }), "/categories");
}

// إضافة فئة جديدة.
export async function createCategoryAction(prevState: any, formData: FormData) {
  await getAuthUser();

  return runAction(async () => {
    const fields = validateFuctionSchema(categorySchema, Object.fromEntries(formData));

    if (await isNameUsed(fields.name)) throw new Error("هذي الفئة موجودة مسبقاً");

    await prisma.category.create({ data: fields });

    revalidatePath("/categories");
    return "تمت إضافة الفئة بنجاح";
  });
}

// تعديل اسم فئة.
export async function updateCategoryAction(prevState: any, formData: FormData) {
  await getAuthUser();

  return runAction(async () => {
    const categoryId = formData.get("id") as string;
    const fields = validateFuctionSchema(categorySchema, Object.fromEntries(formData));

    if (await isNameUsed(fields.name, categoryId)) {
      throw new Error("هذي الفئة موجودة مسبقاً");
    }

    await prisma.category.update({ where: { id: categoryId }, data: fields });

    revalidatePath("/categories");
    return "تم تعديل الفئة بنجاح";
  });
}

// حذف فئة.
export async function deleteCategoryAction({ categoryId }: { categoryId: string }) {
  await getAuthUser();

  return runAction(async () => {
    // ماكدر نحذف فئة بيها أدوية
    const medicinesCount = await prisma.medicine.count({ where: { categoryId } });
    if (medicinesCount > 0) {
      throw new Error(`ماكدر تحذف هذي الفئة، بيها ${medicinesCount} دواء مرتبط بيها`);
    }

    await prisma.category.delete({ where: { id: categoryId } });

    revalidatePath("/categories");
    return "تم حذف الفئة بنجاح";
  });
}

// ---- قراءات الصفحات ----
// قراءة الفئات فقط. الصفحات تستدعي هذه الدوال، وPrisma يجلب البيانات مباشرة.


export async function getCategories(): Promise<ActionResult<Awaited<ReturnType<typeof prisma.category.findMany<{ include: { _count: { select: { medicines: true } } } }>>>>
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
