"use server";

// ==========================================
// Server Actions - Sale Logic (FEFO)
// أهم جزء بالتطبيق: يمسح باركود، ينقص من الدفعات
// حسب الأقرب للانتهاء أول، وينشئ فاتورة كاملة
// ==========================================

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { getSessionUser, requireAuth } from "@/lib/session";

// ==========================================
// Types
// ==========================================

// عنصر واحد بسلة البيع (قبل ما نأكد الفاتورة)
type CartItem = {
  barcode: string;
  quantity: number;
};

// ==========================================
// دالة مساعدة: تتحقق من توفر الكمية المطلوبة
// ==========================================

async function checkAvailability(
  tx: Prisma.TransactionClient,
  medicineId: string,
  requestedQuantity: number
) {
  const batches = await tx.batch.findMany({
    where: {
      medicineId,
      quantity: { gt: 0 },
      expiryDate: { gt: new Date() }, // نتجاهل الدفعات المنتهية الصلاحية
    },
    orderBy: { expiryDate: "asc" }, // FEFO - الأقرب للانتهاء أول
  });

  const totalAvailable = batches.reduce((sum, b) => sum + b.quantity, 0);

  return { batches, totalAvailable };
}

// ==========================================
// الدالة الرئيسية: إتمام عملية بيع (فاتورة واحدة)
// ==========================================

export async function createSale(input: {
  items: CartItem[]; // [{ barcode, quantity }, ...]
}) {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const sellerId = auth.user.id;

  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller) {
    return { success: false, error: "حسابك غير موجود. سجّل دخول مرة ثانية" } as const;
  }

  // ندمج نفس الباركود إذا تكرر بالطلب
  const merged = new Map<string, number>();
  for (const item of input.items ?? []) {
    const barcode = item.barcode.trim();
    if (!barcode) continue;
    merged.set(barcode, (merged.get(barcode) ?? 0) + item.quantity);
  }
  const items = [...merged.entries()].map(([barcode, quantity]) => ({
    barcode,
    quantity,
  }));

  if (items.length === 0) {
    return { success: false, error: "السلة فارغة" } as const;
  }

  for (const item of items) {
    if (item.quantity <= 0) {
      return { success: false, error: "الكمية يجب تكون أكبر من صفر" } as const;
    }
  }

  try {
    // كل شي بالأسفل يصير جوة transaction وحدة
    // إذا فشل أي جزء (مثلاً نقص مخزون بالنص)، كل التغييرات ترجع للخلف تلقائياً
    const sale = await prisma.$transaction(async (tx) => {
      let totalPrice = new Prisma.Decimal(0);
      const saleItemsData: {
        medicineId: string;
        quantity: number;
        priceAtSale: Prisma.Decimal;
      }[] = [];

      // نمر على كل عنصر بالسلة
      for (const item of items) {
        const medicine = await tx.medicine.findUnique({
          where: { barcode: item.barcode.trim() },
        });

        if (!medicine) {
          throw new Error(`ماكو دواء بهذا الباركود: ${item.barcode}`);
        }

        const { batches, totalAvailable } = await checkAvailability(
          tx,
          medicine.id,
          item.quantity
        );

        if (totalAvailable < item.quantity) {
          throw new Error(
            `الكمية المتوفرة من "${medicine.name}" غير كافية (المتوفر: ${totalAvailable}, المطلوب: ${item.quantity})`
          );
        }

        // ننقص من الدفعات حسب FEFO - نبدأ بالأقرب للانتهاء
        let remainingToDeduct = item.quantity;

        for (const batch of batches) {
          if (remainingToDeduct <= 0) break;

          const deductFromThisBatch = Math.min(batch.quantity, remainingToDeduct);

          await tx.batch.update({
            where: { id: batch.id },
            data: { quantity: { decrement: deductFromThisBatch } },
          });

          remainingToDeduct -= deductFromThisBatch;
        }

        const itemSubtotal = medicine.price.mul(item.quantity);
        totalPrice = totalPrice.add(itemSubtotal);

        saleItemsData.push({
          medicineId: medicine.id,
          quantity: item.quantity,
          priceAtSale: medicine.price, // نحفظ السعر وقت البيع (حتى لو تغير لاحقاً)
        });
      }

      // ننشئ الفاتورة (Sale) مع كل عناصرها (SaleItem) بضربة وحدة
      const createdSale = await tx.sale.create({
        data: {
          soldById: sellerId,
          total: totalPrice,
          items: {
            create: saleItemsData,
          },
        },
        include: {
          items: { include: { medicine: true } },
          soldBy: true,
        },
      });

      return createdSale;
    });

    revalidatePath("/medicines");
    revalidatePath("/sales");

    return { success: true, data: sale } as const;
  } catch (error) {
    // أي خطأ صار جوة الـ transaction (مخزون غير كافي، دواء مو موجود...)
    const message =
      error instanceof Error ? error.message : "فشلت عملية البيع";
    return { success: false, error: message } as const;
  }
}

// ==========================================
// جلب سجل المبيعات (للوحة التحكم / التقارير)
// ==========================================

export async function getSales(options?: {
  sellerId?: string;
  fromDate?: Date;
  toDate?: Date;
}) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: "لازم تكون مسجل دخول" } as const;
    }

    const sellerId =
      user.role === "ADMIN" ? options?.sellerId : user.id;

    const sales = await prisma.sale.findMany({
      where: {
        soldById: sellerId || undefined,
        createdAt: {
          gte: options?.fromDate || undefined,
          lte: options?.toDate || undefined,
        },
      },
      include: {
        soldBy: true,
        items: { include: { medicine: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: sales } as const;
  } catch (error) {
    return { success: false, error: "فشل جلب سجل المبيعات" } as const;
  }
}

export async function getSaleById(id: string) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: "لازم تكون مسجل دخول" } as const;
    }

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        soldBy: true,
        items: { include: { medicine: true } },
      },
    });

    if (!sale) {
      return { success: false, error: "الفاتورة غير موجودة" } as const;
    }

    if (user.role !== "ADMIN" && sale.soldById !== user.id) {
      return { success: false, error: "ما عندك صلاحية تشوف هذي الفاتورة" } as const;
    }

    return { success: true, data: sale } as const;
  } catch (error) {
    return { success: false, error: "فشل جلب الفاتورة" } as const;
  }
}

// ==========================================
// إحصائيات بسيطة (لوحة التحكم)
// ==========================================

export async function getSalesSummary(options?: {
  fromDate?: Date;
  toDate?: Date;
}) {
  try {
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: options?.fromDate || undefined,
          lte: options?.toDate || undefined,
        },
      },
      select: { total: true },
    });

    const totalRevenue = sales.reduce(
      (sum, s) => sum.add(s.total),
      new Prisma.Decimal(0)
    );

    return {
      success: true,
      data: {
        salesCount: sales.length,
        totalRevenue: totalRevenue.toNumber(),
      },
    } as const;
  } catch (error) {
    return { success: false, error: "فشل جلب إحصائيات المبيعات" } as const;
  }
}
