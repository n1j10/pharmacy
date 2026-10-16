"use server";

// كتابة الدفعات. الكمية وتاريخ الانتهاء وسعر التكلفة مصدر المخزون.

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";

export async function createBatch(input: {
  medicineId: string;
  quantity: number;
  expiryDate: Date;
  costPrice?: number;
}) {
  const access = await requireAdmin();
  if (!access.success) return access;

  try {
    if (input.quantity <= 0) {
      return { success: false, error: "الكمية يجب تكون أكبر من صفر" } as const;
    }

    const medicine = await prisma.medicine.findUnique({
      where: { id: input.medicineId },
    });
    if (!medicine) {
      return { success: false, error: "الدواء غير موجود" } as const;
    }

    const batch = await prisma.batch.create({
      data: {
        medicineId: input.medicineId,
        quantity: input.quantity,
        expiryDate: input.expiryDate,
        costPrice: input.costPrice,
      },
    });

    revalidatePath("/medicines");
    revalidatePath(`/medicines/${input.medicineId}`);
    return { success: true, data: batch } as const;
  } catch {
    return { success: false, error: "فشل إضافة الدفعة" } as const;
  }
}

export async function updateBatch(
  id: string,
  input: { quantity?: number; expiryDate?: Date; costPrice?: number }
) {
  const access = await requireAdmin();
  if (!access.success) return access;

  try {
    if (input.quantity !== undefined && input.quantity < 0) {
      return { success: false, error: "الكمية ماكدر تكون سالبة" } as const;
    }

    const batch = await prisma.batch.update({
      where: { id },
      data: {
        quantity: input.quantity,
        expiryDate: input.expiryDate,
        costPrice: input.costPrice,
      },
    });

    revalidatePath("/medicines");
    revalidatePath(`/medicines/${batch.medicineId}`);
    return { success: true, data: batch } as const;
  } catch {
    return { success: false, error: "فشل تعديل الدفعة" } as const;
  }
}

export async function deleteBatch(id: string) {
  const access = await requireAdmin();
  if (!access.success) return access;

  try {
    const batch = await prisma.batch.findUnique({ where: { id } });
    if (!batch) {
      return { success: false, error: "الدفعة غير موجودة" } as const;
    }

    const used = await prisma.saleDeduction.count({ where: { batchId: id } });
    if (used > 0) {
      return {
        success: false,
        error: "ماكدر تحذف هذي الدفعة لأنها مرتبطة بمبيعات",
      } as const;
    }

    await prisma.batch.delete({ where: { id } });
    revalidatePath("/medicines");
    revalidatePath(`/medicines/${batch.medicineId}`);
    return { success: true, data: undefined } as const;
  } catch {
    return { success: false, error: "فشل حذف الدفعة" } as const;
  }
}
