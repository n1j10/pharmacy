"use server";

// قراءة المبيعات والفواتير. البائع يرى فواتيره فقط، المدير يرى الكل.

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getSessionUser, requireAuth } from "@/lib/session";

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
