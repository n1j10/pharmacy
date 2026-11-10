"use server";
import { getSessionUser, requireAuth } from "@/lib/session";

// إتمام البيع. الفكرة:
// 1) نتحقق من السلة.
// 2) نسحب الكمية من الدفعات بنظام FEFO (الأقرب للانتهاء أولاً).
// 3) نسجل من أي دفعة انسحب (SaleDeduction) حتى الإرجاع يرجع لنفس الدفعة.
// كل شي داخل transaction واحدة: إذا صار أي خطأ، ما ينحفظ شي.

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import type { Medicine } from "@prisma/client";
import { saleSchema, parseJsonField, validateFuctionSchema } from "@/lib/schema";
import { getAuthUser } from "./user";
import { renderError, orRedirect, contains, availableBatches } from "./helpers";

type CartItem = {
  barcode: string;
  quantity: number;
};

// الأدمن يشوف كل الفواتير (undefined = بدون فلتر)، والبائع يشوف فواتيره فقط
const soldByFilter = (user: { id: string; role: string }) =>
  user.role === "ADMIN" ? undefined : user.id;

// إذا نفس الباركود انكرر بالسلة نجمع كمياته بسطر واحد
const mergeCartItems = (items: CartItem[]) => {
  const quantities = new Map<string, number>();

  for (const item of items) {
    const barcode = item.barcode.trim();
    if (barcode) quantities.set(barcode, (quantities.get(barcode) ?? 0) + item.quantity);
  }

  return [...quantities].map(([barcode, quantity]) => ({ barcode, quantity }));
};

// رقم الفاتورة مثل: INV-2026-0001 (العداد يبدأ من جديد كل سنة)
const nextInvoiceNumber = async (tx: Prisma.TransactionClient) => {
  const year = new Date().getFullYear();

  const counter = await tx.invoiceCounter.upsert({
    where: { year },
    create: { year, last: 1 },
    update: { last: { increment: 1 } },
  });

  return `INV-${year}-${String(counter.last).padStart(4, "0")}`;
};

// ينقص الكمية من دفعات الدواء (الأقرب للانتهاء أولاً)
// ويرجع قائمة بالدفعات اللي انسحب منها.
const takeFromBatches = async (
  tx: Prisma.TransactionClient,
  medicine: Medicine,
  quantity: number,
) => {
  const batches = await tx.batch.findMany({
    where: { medicineId: medicine.id, ...availableBatches() },
    orderBy: { expiryDate: "asc" },
  });

  const available = batches.reduce((sum, batch) => sum + batch.quantity, 0);
  if (available < quantity) {
    throw new Error(
      `الكمية المتوفرة من "${medicine.name}" غير كافية (المتوفر: ${available}, المطلوب: ${quantity})`,
    );
  }

  const deductions = [];
  let left = quantity; // الكمية اللي بعدها لازم ننقصها

  for (const batch of batches) {
    if (left === 0) break;

    const take = Math.min(batch.quantity, left);

    await tx.batch.update({
      where: { id: batch.id },
      data: { quantity: { decrement: take } },
    });

    deductions.push({ batchId: batch.id, quantity: take, costPrice: batch.costPrice });
    left -= take;
  }

  return deductions;
};

// يمر على كل دواء بالسلة: ينقص من دفعاته، ويرجع مجموع الفاتورة وأصنافها.
const prepareSaleItems = async (tx: Prisma.TransactionClient, items: CartItem[]) => {
  let subtotal = new Prisma.Decimal(0);
  const saleItems: Prisma.SaleItemUncheckedCreateWithoutSaleInput[] = [];

  for (const item of items) {
    const medicine = await tx.medicine.findUnique({ where: { barcode: item.barcode } });
    if (!medicine) throw new Error(`ماكو دواء بهذا الباركود: ${item.barcode}`);

    const deductions = await takeFromBatches(tx, medicine, item.quantity);

    subtotal = subtotal.add(medicine.price.mul(item.quantity));
    saleItems.push({
      medicineId: medicine.id,
      quantity: item.quantity,
      priceAtSale: medicine.price, // نحفظ السعر وقت البيع
      deductions: { create: deductions },
    });
  }

  return { subtotal, saleItems };
};

// كل الفواتير (الأحدث أولاً). فلتر اختياري: بحث برقم الفاتورة.
// البائع يشوف فواتيره فقط، المدير يشوف الكل.
export async function fetchSales({ search }: { search?: string } = {}) {
  const user = await getAuthUser();

  return prisma.sale.findMany({
    where: {
      soldById: soldByFilter(user),
      invoiceNumber: search ? contains(search) : undefined,
    },
    include: {
      soldBy: { select: { id: true, name: true } },
      customer: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

// فاتورة وحدة (مع الأصناف والإرجاعات).
// إذا مو موجودة (أو مو فاتورة هذا البائع) يروح لصفحة المبيعات.
export async function fetchSingleSale(id: string) {
  const user = await getAuthUser();

  const sale = await prisma.sale.findFirst({
    where: { id, soldById: soldByFilter(user) },
    include: {
      items: { include: { medicine: true } },
      soldBy: { select: { id: true, name: true } },
      customer: true,
      returns: { include: { items: true }, orderBy: { createdAt: "desc" } },
    },
  });
  return orRedirect(sale, "/sales");
}

// إتمام البيع، وبعدها نروح لصفحة الفاتورة.
// السلة تجي من الفورم كنص JSON بحقل items: [{ barcode, quantity }]
export async function createSaleAction(prevState: any, formData: FormData) {
  const user = await getAuthUser();
  let saleId = "";

  try {
    // نتأكد البائع موجود وحسابه مفعّل
    const seller = await prisma.user.findUnique({ where: { id: user.id } });
    if (!seller || !seller.isActive) throw new Error("حسابك غير موجود أو معطّل");

    const fields = validateFuctionSchema(saleSchema, {
      ...Object.fromEntries(formData),
      items: parseJsonField(formData.get("items")),
    });

    // التحقق من السلة
    const items = mergeCartItems(fields.items);
    if (items.length === 0) throw new Error("السلة فارغة");
    if (items.some((item) => item.quantity <= 0)) {
      throw new Error("الكمية يجب تكون أكبر من صفر");
    }

    const sale = await prisma.$transaction(async (tx) => {
      const { subtotal, saleItems } = await prepareSaleItems(tx, items);

      if (fields.discount > subtotal.toNumber()) {
        throw new Error("الخصم أكبر من مجموع الفاتورة");
      }

      return tx.sale.create({
        data: {
          invoiceNumber: await nextInvoiceNumber(tx),
          soldById: user.id,
          customerId: fields.customerId || undefined,
          subtotal,
          discount: fields.discount,
          total: subtotal.sub(fields.discount),
          paymentMethod: fields.paymentMethod,
          items: { create: saleItems },
        },
      });
    });

    saleId = sale.id;

    revalidatePath("/medicines");
    revalidatePath("/sales");
    revalidatePath("/");
  } catch (error) {
    return renderError(error);
  }

  // redirect must stay outside try/catch
  redirect(`/sales/${saleId}`);
}

// ---- قراءات الصفحات ----
// قراءة المبيعات والفواتير. البائع يرى فواتيره فقط، المدير يرى الكل.


const saleInclude = {
  soldBy: true,
  customer: true,
  items: {
    include: {
      medicine: true,
      deductions: true,
      returnItems: true,
    },
  },
  returns: { include: { items: true, returnedBy: true } },
} satisfies Prisma.SaleInclude;

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

    const sellerId = user.role === "ADMIN" ? options?.sellerId : user.id;

    const sales = await prisma.sale.findMany({
      where: {
        soldById: sellerId || undefined,
        createdAt: {
          gte: options?.fromDate || undefined,
          lte: options?.toDate || undefined,
        },
      },
      include: saleInclude,
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: sales } as const;
  } catch {
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
      include: saleInclude,
    });

    if (!sale) {
      return { success: false, error: "الفاتورة غير موجودة" } as const;
    }

    if (user.role !== "ADMIN" && sale.soldById !== user.id) {
      return { success: false, error: "ما عندك صلاحية تشوف هذي الفاتورة" } as const;
    }

    const profit = sale.items.reduce((sum, item) => {
      const cost = item.deductions.reduce((c, d) => {
        const remaining = d.quantity - d.returnedQuantity;
        return c + Number(d.costPrice ?? 0) * remaining;
      }, 0);
      const returnedQty = item.returnItems.reduce((q, r) => q + r.quantity, 0);
      const soldQty = item.quantity - returnedQty;
      return sum + Number(item.priceAtSale) * soldQty - cost;
    }, 0);

    const discountShare =
      Number(sale.subtotal) > 0
        ? (Number(sale.discount) / Number(sale.subtotal)) *
          sale.items.reduce((sum, item) => {
            const returnedQty = item.returnItems.reduce((q, r) => q + r.quantity, 0);
            return sum + Number(item.priceAtSale) * (item.quantity - returnedQty);
          }, 0)
        : Number(sale.discount);

    return {
      success: true,
      data: { ...sale, profit: profit - discountShare },
    } as const;
  } catch {
    return { success: false, error: "فشل جلب الفاتورة" } as const;
  }
}

export async function getSalesSummary(options?: { fromDate?: Date; toDate?: Date }) {
  try {
    const auth = await requireAuth();
    if (!auth.success) return auth;

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: options?.fromDate || undefined,
          lte: options?.toDate || undefined,
        },
        ...(auth.user.role === "ADMIN" ? {} : { soldById: auth.user.id }),
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
  } catch {
    return { success: false, error: "فشل جلب إحصائيات المبيعات" } as const;
  }
}
