"use server";
import { sellableQuantity } from "@/lib/inventory";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { batchSchema, batchUpdateSchema, validateFuctionSchema } from "@/lib/schema";
import { getAdminUser } from "./user";
import { runAction } from "./helpers";

// الدفعات (Batches): كل دفعة إلها كمية وتاريخ انتهاء وسعر تكلفة.
// المدير فقط يكدر يضيف / يعدل / يحذف.
// (قراءة الدفعات تجي مع fetchSingleMedicine بملف medicines.ts)

// تحديث صفحات الأدوية بعد أي تغيير بالدفعات
const refreshMedicinePages = (medicineId: string) => {
  revalidatePath("/medicines");
  revalidatePath(`/medicines/${medicineId}`);
};

// إضافة دفعة لدواء.
export async function createBatchAction(prevState: any, formData: FormData) {
  await getAdminUser();

  return runAction(async () => {
    const fields = validateFuctionSchema(batchSchema, Object.fromEntries(formData));

    const medicine = await prisma.medicine.findUnique({ where: { id: fields.medicineId } });
    if (!medicine) throw new Error("الدواء غير موجود");

    await prisma.batch.create({ data: fields });

    refreshMedicinePages(fields.medicineId);
    return "تمت إضافة الدفعة بنجاح";
  });
}

// تعديل دفعة (الكمية، تاريخ الانتهاء، سعر التكلفة).
export async function updateBatchAction(prevState: any, formData: FormData) {
  await getAdminUser();

  return runAction(async () => {
    const batchId = formData.get("id") as string;
    const fields = validateFuctionSchema(batchUpdateSchema, Object.fromEntries(formData));

    const batch = await prisma.batch.update({ where: { id: batchId }, data: fields });

    refreshMedicinePages(batch.medicineId);
    return "تم تعديل الدفعة بنجاح";
  });
}

// حذف دفعة.
export async function deleteBatchAction({ batchId }: { batchId: string }) {
  await getAdminUser();

  return runAction(async () => {
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw new Error("الدفعة غير موجودة");

    // إذا الدفعة انباع منها قبل، ماكدر نحذفها
    const salesCount = await prisma.saleDeduction.count({ where: { batchId } });
    if (salesCount > 0) {
      throw new Error("ماكدر تحذف هذي الدفعة لأنها مرتبطة بمبيعات");
    }

    await prisma.batch.delete({ where: { id: batchId } });

    refreshMedicinePages(batch.medicineId);
    return "تم حذف الدفعة بنجاح";
  });
}

// ---- قراءات الصفحات ----
// قراءة الدفعات وإحصائيات المخزون وانتهاء الصلاحية.


export async function getInventoryStats() {
  try {
    const [medicineCount, medicines] = await Promise.all([
      prisma.medicine.count(),
      prisma.medicine.findMany({ include: { batches: true } }),
    ]);

    const withStock = medicines.map((medicine) => ({
      totalQuantity: sellableQuantity(medicine.batches),
    }));

    const outOfStock = withStock.filter((m) => m.totalQuantity === 0).length;
    const lowStock = withStock.filter((m) => m.totalQuantity > 0 && m.totalQuantity < 10).length;

    return {
      success: true,
      data: { medicineCount, outOfStock, lowStock },
    } as const;
  } catch {
    return { success: false, error: "فشل جلب إحصائيات المخزون" } as const;
  }
}

export async function getBatchesByMedicine(medicineId: string) {
  try {
    const batches = await prisma.batch.findMany({
      where: { medicineId },
      orderBy: { expiryDate: "asc" },
    });
    return { success: true, data: batches } as const;
  } catch {
    return { success: false, error: "فشل جلب الدفعات" } as const;
  }
}

export async function getExpiringSoonBatches(daysThreshold: number = 30) {
  try {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const batches = await prisma.batch.findMany({
      where: {
        expiryDate: { lte: thresholdDate, gte: new Date() },
        quantity: { gt: 0 },
      },
      include: { medicine: { include: { category: true } } },
      orderBy: { expiryDate: "asc" },
    });

    return { success: true, data: batches } as const;
  } catch {
    return { success: false, error: "فشل جلب الدفعات القريبة من الانتهاء" } as const;
  }
}

export async function getLowStockMedicines(threshold: number = 10) {
  try {
    const medicines = await prisma.medicine.findMany({
      include: { category: true, batches: true },
      orderBy: { name: "asc" },
    });

    const low = medicines
      .map((medicine) => ({
        ...medicine,
        totalQuantity: sellableQuantity(medicine.batches),
      }))
      .filter((m) => m.totalQuantity < threshold);

    return { success: true, data: low } as const;
  } catch {
    return { success: false, error: "فشل جلب المخزون المنخفض" } as const;
  }
}
