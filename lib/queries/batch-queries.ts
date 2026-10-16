"use server";

// قراءة الدفعات وإحصائيات المخزون وانتهاء الصلاحية.

import { prisma } from "@/lib/prisma";
import { sellableQuantity } from "@/lib/inventory";

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
