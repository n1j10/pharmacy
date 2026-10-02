"use server";

// الأدوية (Medicines): المدير فقط. الباركود يتولد تلقائياً.

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { requireAdmin } from "@/lib/session";
import { ok, fail } from "./helpers";

// يسوي باركود مثل: PH12345678 + 4 أرقام عشوائية
function generateBarcode() {
  const timestamp = Date.now().toString().slice(-8);
  const random = crypto.randomInt(1000, 9999);
  return `PH${timestamp}${random}`;
}

// يولّد باركود ويتأكد ما مستخدم (يجرب 5 مرات)
async function createUniqueBarcode() {
  for (let i = 0; i < 5; i++) {
    const barcode = generateBarcode();
    const exists = await prisma.medicine.findUnique({ where: { barcode } });
    if (!exists) return barcode;
  }
  throw new Error("ما كدرنا نولّد باركود فريد");
}

type CreateMedicineInput = {
  name: string;
  description?: string;
  price: number;
  unit?: string;
  manufacturer?: string;
  imageUrl?: string;
  categoryId: string;
  // دفعة أولى اختيارية تنضاف مع الدواء
  initialBatch?: {
    quantity: number;
    expiryDate: Date;
    costPrice?: number;
  };
};

export async function createMedicine(input: CreateMedicineInput) {
  const access = await requireAdmin();
  if (!access.success) return access;

  const name = input.name?.trim();
  if (!name) {
    return fail("اسم الدواء مطلوب");
  }
  if (!input.categoryId) {
    return fail("الفئة مطلوبة");
  }
  if (Number.isNaN(input.price) || input.price <= 0) {
    return fail("السعر يجب يكون أكبر من صفر");
  }
  if (input.initialBatch && input.initialBatch.quantity <= 0) {
    return fail("كمية الدفعة الأولى يجب تكون أكبر من صفر");
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
    });
    if (!category) {
      return fail("الفئة المحددة غير موجودة");
    }

    const barcode = await createUniqueBarcode();

    const medicine = await prisma.medicine.create({
      data: {
        name,
        description: input.description,
        barcode,
        price: input.price,
        unit: input.unit,
        manufacturer: input.manufacturer,
        imageUrl: input.imageUrl,
        categoryId: input.categoryId,
        // إذا جاي دفعة أولى ننشئها مع الدواء، وإلا undefined (ما ننشئ شي)
        batches: input.initialBatch ? { create: input.initialBatch } : undefined,
      },
      include: { category: true, batches: true },
    });

    revalidatePath("/medicines");
    return ok(medicine);
  } catch {
    return fail("فشل إنشاء الدواء");
  }
}

type UpdateMedicineInput = {
  name?: string;
  description?: string;
  price?: number;
  unit?: string;
  manufacturer?: string;
  imageUrl?: string;
  categoryId?: string;
};

export async function updateMedicine(id: string, input: UpdateMedicineInput) {
  const access = await requireAdmin();
  if (!access.success) return access;

  try {
    const medicine = await prisma.medicine.update({
      where: { id },
      data: {
        name: input.name?.trim(),
        description: input.description,
        price: input.price,
        unit: input.unit,
        manufacturer: input.manufacturer,
        imageUrl: input.imageUrl,
        categoryId: input.categoryId,
      },
      include: { category: true, batches: true },
    });

    revalidatePath("/medicines");
    revalidatePath(`/medicines/${id}`);
    return ok(medicine);
  } catch {
    return fail("فشل تعديل الدواء");
  }
}

export async function deleteMedicine(id: string) {
  const access = await requireAdmin();
  if (!access.success) return access;

  try {
    // ماكدر نحذف دواء انباع قبل
    const salesCount = await prisma.saleItem.count({ where: { medicineId: id } });
    if (salesCount > 0) {
      return fail("ماكدر تحذف هذا الدواء، عنده سجل مبيعات سابق");
    }

    // نحذف الدفعات ثم الدواء. $transaction يعني: يا ينحذفون الاثنين يا ولا واحد
    await prisma.$transaction([
      prisma.batch.deleteMany({ where: { medicineId: id } }),
      prisma.medicine.delete({ where: { id } }),
    ]);

    revalidatePath("/medicines");
    return ok();
  } catch {
    return fail("فشل حذف الدواء");
  }
}
