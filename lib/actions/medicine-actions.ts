"use server";

// ==========================================
// Server Actions - Pharmacy App
// Medicine + Category + Batch (CRUD كامل)
// ==========================================

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { requireAdmin } from "@/lib/session";

// ==========================================
// Types مساعدة
// ==========================================

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

// ==========================================
// أدوات مساعدة
// ==========================================

// توليد باركود فريد للدواء (prefix + timestamp + رقم عشوائي)
function generateBarcode(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = crypto.randomInt(1000, 9999);
  return `PH${timestamp}${random}`;
}

// ==========================================
// Category - Server Actions
// ==========================================

export async function getCategories(): Promise<ActionResult<Awaited<ReturnType<typeof prisma.category.findMany>>>> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { medicines: true } },
      },
    });
    return { success: true, data: categories };
  } catch (error) {
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
  } catch (error) {
    return { success: false, error: "فشل جلب الفئة" } as const;
  }
}

export async function createCategory(name: string) {
  const access = await requireAdmin();
  if (!access.success) return access;

  try {
    if (!name || name.trim().length === 0) {
      return { success: false, error: "اسم الفئة مطلوب" } as const;
    }

    const existing = await prisma.category.findUnique({ where: { name } });
  
    if (existing) {
      return { success: false, error: "هذي الفئة موجودة مسبقاً" } as const;
    }

    const category = await prisma.category.create({
      data: { name: name.trim() },
    });

    revalidatePath("/categories");
    return { success: true, data: category } as const;
  } catch (error) {
    return { success: false, error: "فشل إنشاء الفئة" } as const;
  }
}

export async function updateCategory(id: string, name: string) {
  const access = await requireAdmin();
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
  } catch (error) {
    return { success: false, error: "فشل تعديل الفئة" } as const;
  }
}

export async function deleteCategory(id: string) {
  const access = await requireAdmin();
  if (!access.success) return access;

  try {
    // نتأكد ماكو أدوية مرتبطة بيها قبل الحذف
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
  } catch (error) {
    return { success: false, error: "فشل حذف الفئة" } as const;
  }
}

// ==========================================
// Medicine - Server Actions
// ==========================================

function sellableQuantity(
  batches: { quantity: number; expiryDate: Date }[]
) {
  const now = new Date();
  return batches.reduce((sum, batch) => {
    if (batch.quantity > 0 && batch.expiryDate > now) {
      return sum + batch.quantity;
    }
    return sum;
  }, 0);
}

export async function getMedicines(options?: {categoryId?: string;search?: string;}) {
  try {
    const search = options?.search?.trim();

    const medicines = await prisma.medicine.findMany({
      where: {
        categoryId: options?.categoryId || undefined,

        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { barcode: { contains: search, mode: "insensitive" } },
                { manufacturer: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        category: true,
        batches: {
          orderBy: { expiryDate: "asc" }, 
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // الكمية القابلة للبيع فقط (نتجاهل الدفعات المنتهية)
    const medicinesWithStock = medicines.map((medicine: typeof medicines[number]) => ({...medicine,
      totalQuantity: sellableQuantity(medicine.batches),
    }));

    return { success: true, data: medicinesWithStock } as const;
  } catch (error) {
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

    const totalQuantity = sellableQuantity(medicine.batches);

    return { success: true, data: { ...medicine, totalQuantity } } as const;
  } catch (error) {
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

    const totalQuantity = sellableQuantity(medicine.batches);

    return { success: true, data: { ...medicine, totalQuantity } } as const;
  } catch (error) {
    return { success: false, error: "فشل البحث عن الدواء" } as const;
  }
}

type CreateMedicineInput = {
  name: string;
  description?: string;
  price: number;
  unit?: string;
  manufacturer?: string;
  imageUrl?: string;
  categoryId: string;
  // دفعة أولى اختيارية وقت الإنشاء
  initialBatch?: {
    quantity: number;
    expiryDate: Date;
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

    if (input.initialBatch) {
      if (input.initialBatch.quantity <= 0) {
        return { success: false, error: "كمية الدفعة الأولى يجب تكون أكبر من صفر" } as const;
      }
    }

    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
    });
    
    if (!category) {
      return { success: false, error: "الفئة المحددة غير موجودة" } as const;
    }

    // نولد باركود فريد (نتأكد ما يتكرر)
    let barcode = generateBarcode();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await prisma.medicine.findUnique({ where: { barcode } });
      if (!exists) break;
      barcode = generateBarcode();
      attempts++;
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
              },
            }
          : undefined,
      },
      include: { category: true, batches: true },
    });

    revalidatePath("/medicines");
    return { success: true, data: medicine } as const;
  } catch (error) {
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
  } catch (error) {
    return { success: false, error: "فشل تعديل الدواء" } as const;
  }
}

export async function deleteMedicine(id: string) {
  const access = await requireAdmin();
  if (!access.success) return access;

  try {
    // نتأكد ماكو مبيعات مرتبطة (نحافظ على سجل تاريخي)
    const salesCount = await prisma.saleItem.count({
      where: { medicineId: id },
    });

    if (salesCount > 0) {
      return {
        success: false,
        error: "ماكدر تحذف هذا الدواء، عنده سجل مبيعات سابق",
      } as const;
    }

    // نحذف الدفعات المرتبطة أول
    await prisma.batch.deleteMany({ where: { medicineId: id } });
    await prisma.medicine.delete({ where: { id } });

    revalidatePath("/medicines");
    return { success: true, data: undefined } as const;
  } catch (error) {
    return { success: false, error: "فشل حذف الدواء" } as const;
  }
}

// ==========================================
// Batch - Server Actions
// ==========================================

export async function getInventoryStats() {
  try {
    const [medicineCount, medicines] = await Promise.all([
      prisma.medicine.count(),
      prisma.medicine.findMany({
        include: { batches: true },
      }),
    ]);

    const withStock = medicines.map((medicine: typeof medicines[number]) => ({
      totalQuantity: sellableQuantity(medicine.batches),
    }));

    const outOfStock = withStock.filter((m: { totalQuantity: number }) => m.totalQuantity === 0).length;
    const lowStock = withStock.filter(
      (m: { totalQuantity: number }) => m.totalQuantity > 0 && m.totalQuantity < 10
    ).length;

    return {
      success: true,
      data: { medicineCount, outOfStock, lowStock },
    } as const;
  } catch (error) {
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
  } catch (error) {
    return { success: false, error: "فشل جلب الدفعات" } as const;
  }
}

// الدفعات القريبة من الانتهاء (خلال عدد أيام محدد)
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
  } catch (error) {
    return { success: false, error: "فشل جلب الدفعات القريبة من الانتهاء" } as const;
  }
}

export async function createBatch(input: {
  medicineId: string;
  quantity: number;
  expiryDate: Date;
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
      },
    });

    revalidatePath("/medicines");
    revalidatePath(`/medicines/${input.medicineId}`);
    return { success: true, data: batch } as const;
  } catch (error) {
    return { success: false, error: "فشل إضافة الدفعة" } as const;
  }
}

export async function updateBatch(
  id: string,
  input: { quantity?: number; expiryDate?: Date }
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
      },
    });

    revalidatePath("/medicines");
    revalidatePath(`/medicines/${batch.medicineId}`);
    return { success: true, data: batch } as const;
  } catch (error) {
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

    await prisma.batch.delete({ where: { id } });

    revalidatePath("/medicines");
    revalidatePath(`/medicines/${batch.medicineId}`);
    return { success: true, data: undefined } as const;
  } catch (error) {
    return { success: false, error: "فشل حذف الدفعة" } as const;
  }
}
