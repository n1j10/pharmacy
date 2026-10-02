"use server";

// الدفعات (Batches): كل دفعة إلها كمية وتاريخ انتهاء وسعر تكلفة.
// المدير فقط يكدر يضيف / يعدل / يحذف.

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { ok, fail } from "./helpers";

// تحديث صفحات الأدوية بعد أي تغيير بالدفعات
function refreshMedicinePages(medicineId: string) {
  revalidatePath("/medicines");
  revalidatePath(`/medicines/${medicineId}`);
}

export async function createBatch(input: {
  medicineId: string;
  quantity: number;
  expiryDate: Date;
  costPrice?: number;
}) {
  const access = await requireAdmin();
  if (!access.success) return access;

  if (input.quantity <= 0) {
    return fail("الكمية يجب تكون أكبر من صفر");
  }

  try {
    const medicine = await prisma.medicine.findUnique({
      where: { id: input.medicineId },
    });
    if (!medicine) {
      return fail("الدواء غير موجود");
    }

    const batch = await prisma.batch.create({
      data: {
        medicineId: input.medicineId,
        quantity: input.quantity,
        expiryDate: input.expiryDate,
        costPrice: input.costPrice,
      },
    });

    refreshMedicinePages(input.medicineId);
    return ok(batch);
  } catch {
    return fail("فشل إضافة الدفعة");
  }
}

export async function updateBatch(
  id: string,
  input: { quantity?: number; expiryDate?: Date; costPrice?: number }
) {
  const access = await requireAdmin();
  if (!access.success) return access;

  if (input.quantity !== undefined && input.quantity < 0) {
    return fail("الكمية ماكدر تكون سالبة");
  }

  try {
    const batch = await prisma.batch.update({
      where: { id },
      data: {
        quantity: input.quantity,
        expiryDate: input.expiryDate,
        costPrice: input.costPrice,
      },
    });

    refreshMedicinePages(batch.medicineId);
    return ok(batch);
  } catch {
    return fail("فشل تعديل الدفعة");
  }
}

export async function deleteBatch(id: string) {
  const access = await requireAdmin();
  if (!access.success) return access;

  try {
    const batch = await prisma.batch.findUnique({ where: { id } });
    if (!batch) {
      return fail("الدفعة غير موجودة");
    }

    // إذا الدفعة انباعت منها قبل، ماكدر نحذفها
    const salesCount = await prisma.saleDeduction.count({ where: { batchId: id } });
    if (salesCount > 0) {
      return fail("ماكدر تحذف هذي الدفعة لأنها مرتبطة بمبيعات");
    }

    await prisma.batch.delete({ where: { id } });

    refreshMedicinePages(batch.medicineId);
    return ok();
  } catch {
    return fail("فشل حذف الدفعة");
  }
}
