"use server";

// كتابة الأدوية. للمدير فقط. الباركود يتولد تلقائياً.

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { requireAdmin } from "@/lib/session";

function generateBarcode(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = crypto.randomInt(1000, 9999);
  return `PH${timestamp}${random}`;
}

type CreateMedicineInput = {
  name: string;
  description?: string;
  price: number;
  unit?: string;
  manufacturer?: string;
  imageUrl?: string;
  categoryId: string;
  initialBatch?: {
    quantity: number;
    expiryDate: Date;
    costPrice?: number;
  };
};

export async function createMedicine(input: CreateMedicineInput) {
  const access = await requireAdmin();
  if (!access.success) return access;

  try {
    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: "اسم الدواء مطلوب" } as const;
    }
    if (!input.categoryId) {
      return { success: false, error: "الفئة مطلوبة" } as const;
    }
    if (Number.isNaN(input.price) || input.price <= 0) {
      return { success: false, error: "السعر يجب يكون أكبر من صفر" } as const;
    }
    if (input.initialBatch && input.initialBatch.quantity <= 0) {
      return { success: false, error: "كمية الدفعة الأولى يجب تكون أكبر من صفر" } as const;
    }

    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
    });
    if (!category) {
      return { success: false, error: "الفئة المحددة غير موجودة" } as const;
    }

    let barcode = generateBarcode();
    for (let attempts = 0; attempts < 5; attempts++) {
      const exists = await prisma.medicine.findUnique({ where: { barcode } });
      if (!exists) break;
      barcode = generateBarcode();
    }

    const medicine = await prisma.medicine.create({
      data: {
        name: input.name.trim(),
        description: input.description,
        barcode,
        price: input.price,
        unit: input.unit,
        manufacturer: input.manufacturer,
        imageUrl: input.imageUrl,
        categoryId: input.categoryId,
        batches: input.initialBatch
          ? {
              create: {
                quantity: input.initialBatch.quantity,
                expiryDate: input.initialBatch.expiryDate,
                costPrice: input.initialBatch.costPrice,
              },
            }
          : undefined,
      },
      include: { category: true, batches: true },
    });

    revalidatePath("/medicines");
    return { success: true, data: medicine } as const;
  } catch {
    return { success: false, error: "فشل إنشاء الدواء" } as const;
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
    return { success: true, data: medicine } as const;
  } catch {
    return { success: false, error: "فشل تعديل الدواء" } as const;
  }
}

export async function deleteMedicine(id: string) {
  const access = await requireAdmin();
  if (!access.success) return access;

  try {
    const salesCount = await prisma.saleItem.count({ where: { medicineId: id } });
    if (salesCount > 0) {
      return {
        success: false,
        error: "ماكدر تحذف هذا الدواء، عنده سجل مبيعات سابق",
      } as const;
    }

    await prisma.batch.deleteMany({ where: { medicineId: id } });
    await prisma.medicine.delete({ where: { id } });

    revalidatePath("/medicines");
    return { success: true, data: undefined } as const;
  } catch {
    return { success: false, error: "فشل حذف الدواء" } as const;
  }
}
