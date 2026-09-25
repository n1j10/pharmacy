"use server";

// قراءة الأدوية مع الكمية القابلة للبيع (نتجاهل الدفعات المنتهية).

import { prisma } from "@/lib/prisma";
import { sellableQuantity } from "@/lib/inventory";

export async function getMedicines(options?: { categoryId?: string; search?: string }) {
  try {
    const search = options?.search?.trim();

    const medicines = await prisma.medicine.findMany({
      where: {
        categoryId: options?.categoryId || undefined,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { barcode: { contains: search, mode: "insensitive" as const } },
                { manufacturer: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      include: {
        category: true,
        batches: { orderBy: { expiryDate: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: search ? 40 : undefined,
    });

    const medicinesWithStock = medicines.map((medicine) => ({
      ...medicine,
      totalQuantity: sellableQuantity(medicine.batches),
    }));

    return { success: true, data: medicinesWithStock } as const;
  } catch {
    return { success: false, error: "فشل جلب الأدوية" } as const;
  }
}

export async function getMedicineById(id: string) {
  try {
    const medicine = await prisma.medicine.findUnique({
      where: { id },
      include: {
        category: true,
        batches: { orderBy: { expiryDate: "asc" } },
        saleItems: {
          orderBy: { id: "desc" },
          take: 20,
          include: { sale: { include: { soldBy: true } } },
        },
      },
    });

    if (!medicine) {
      return { success: false, error: "الدواء غير موجود" } as const;
    }

    return {
      success: true,
      data: { ...medicine, totalQuantity: sellableQuantity(medicine.batches) },
    } as const;
  } catch {
    return { success: false, error: "فشل جلب الدواء" } as const;
  }
}

export async function getMedicineByBarcode(barcode: string) {
  try {
    const medicine = await prisma.medicine.findUnique({
      where: { barcode: barcode.trim() },
      include: {
        category: true,
        batches: {
          where: { quantity: { gt: 0 }, expiryDate: { gt: new Date() } },
          orderBy: { expiryDate: "asc" },
        },
      },
    });

    if (!medicine) {
      return { success: false, error: "ماكو دواء بهذا الباركود" } as const;
    }

    return {
      success: true,
      data: { ...medicine, totalQuantity: sellableQuantity(medicine.batches) },
    } as const;
  } catch {
    return { success: false, error: "فشل البحث عن الدواء" } as const;
  }
}
