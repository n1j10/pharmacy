"use server";

// تقارير الأدمن: مبيعات الفترة، أكثر الأدوية، الربح.

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { Prisma } from "@prisma/client";

export async function getReports(options?: { fromDate?: Date; toDate?: Date }) {
  const access = await requireAdmin();
  if (!access.success) return access;

  try {
    const fromDate = options?.fromDate;
    const toDate = options?.toDate;

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: fromDate || undefined,
          lte: toDate || undefined,
        },
      },
      include: {
        items: {
          include: {
            medicine: true,
            deductions: true,
            returnItems: true,
          },
        },
        returns: true,
      },
    });

    const revenue = sales.reduce((s, sale) => s + Number(sale.total), 0);
    const returnTotal = sales.reduce(
      (s, sale) => s + sale.returns.reduce((r, ret) => r + Number(ret.total), 0),
      0
    );

    let cost = 0;
    const medicineSales = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >();

    for (const sale of sales) {
      const discountRatio =
        Number(sale.subtotal) > 0 ? Number(sale.discount) / Number(sale.subtotal) : 0;

      for (const item of sale.items) {
        const returned = item.returnItems.reduce((q, r) => q + r.quantity, 0);
        const netQty = item.quantity - returned;
        const lineRevenue = Number(item.priceAtSale) * netQty * (1 - discountRatio);
        const lineCost = item.deductions.reduce((c, d) => {
          const remaining = d.quantity - d.returnedQuantity;
          return c + Number(d.costPrice ?? 0) * remaining;
        }, 0);
        cost += lineCost;

        const prev = medicineSales.get(item.medicineId) ?? {
          name: item.medicine.name,
          quantity: 0,
          revenue: 0,
        };
        prev.quantity += netQty;
        prev.revenue += lineRevenue;
        medicineSales.set(item.medicineId, prev);
      }
    }

    const topMedicines = [...medicineSales.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      success: true,
      data: {
        salesCount: sales.length,
        revenue,
        returnTotal,
        netRevenue: revenue - returnTotal,
        cost,
        profit: revenue - returnTotal - cost,
        topMedicines,
      },
    } as const;
  } catch {
    return { success: false, error: "فشل جلب التقارير" } as const;
  }
}

export async function getTodayAndMonthSummary() {
  const access = await requireAdmin();
  if (!access.success) return access;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [today, month] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: startOfDay } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { total: true },
      _count: true,
    }),
  ]);

  return {
    success: true,
    data: {
      todayCount: today._count,
      todayRevenue: Number(today._sum.total ?? 0),
      monthCount: month._count,
      monthRevenue: Number(month._sum.total ?? 0),
    },
  } as const;
}

export type ReportDecimal = Prisma.Decimal;
