"use server";

// إرجاع كامل أو جزئي لفاتورة.
// الكمية ترجع لنفس الدفعات اللي انسحبت منها (محفوظة بـ SaleDeduction).

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import type { SaleDeduction } from "@prisma/client";
import { requireAuth } from "@/lib/session";
import { ok, fail } from "./helpers";

// يرجع الكمية للدفعات اللي انسحبت منها
async function putBackToBatches(
  tx: Prisma.TransactionClient,
  deductions: SaleDeduction[],
  quantity: number
) {
  let left = quantity; // الكمية اللي بعدها لازم نرجعها

  for (const deduction of deductions) {
    if (left === 0) break;

    // شكد باقي نكدر نرجع من هذا السحب (ممكن انرجع جزء منه قبل)
    const canReturn = deduction.quantity - deduction.returnedQuantity;
    if (canReturn <= 0) continue;

    const give = Math.min(canReturn, left);

    await tx.batch.update({
      where: { id: deduction.batchId },
      data: { quantity: { increment: give } },
    });
    await tx.saleDeduction.update({
      where: { id: deduction.id },
      data: { returnedQuantity: { increment: give } },
    });

    left -= give;
  }
}

export async function createSaleReturn(input: {
  saleId: string;
  items: { saleItemId: string; quantity: number }[];
}) {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const user = auth.user;

  // نتجاهل الأصناف اللي كميتها صفر
  const requested = (input.items ?? []).filter((item) => item.quantity > 0);
  if (requested.length === 0) {
    return fail("حدد كمية للإرجاع");
  }

  try {
    const saleReturn = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: input.saleId },
        include: {
          items: {
            include: {
              medicine: true,
              returnItems: true, // الإرجاعات السابقة
              deductions: { orderBy: { id: "desc" } },
            },
          },
        },
      });

      if (!sale) {
        throw new Error("الفاتورة غير موجودة");
      }

      // البائع يرجع فواتيره فقط، المدير يرجع أي فاتورة
      if (user.role !== "ADMIN" && sale.soldById !== user.id) {
        throw new Error("ما عندك صلاحية ترجع هذي الفاتورة");
      }

      let returnTotal = new Prisma.Decimal(0);

      for (const row of requested) {
        const saleItem = sale.items.find((item) => item.id === row.saleItemId);
        if (!saleItem) {
          throw new Error("صنف الفاتورة غير موجود");
        }

        // الكمية المتبقية = اللي انباعت - اللي انرجع قبل
        const alreadyReturned = saleItem.returnItems.reduce(
          (sum, r) => sum + r.quantity,
          0
        );
        const remaining = saleItem.quantity - alreadyReturned;
        if (row.quantity > remaining) {
          throw new Error(
            `كمية الإرجاع لـ "${saleItem.medicine.name}" أكبر من المتبقي (${remaining})`
          );
        }

        await putBackToBatches(tx, saleItem.deductions, row.quantity);

        returnTotal = returnTotal.add(saleItem.priceAtSale.mul(row.quantity));
      }

      // إذا الفاتورة بيها خصم، ننقص حصة المرتجع من الخصم
      if (sale.subtotal.gt(0) && sale.discount.gt(0)) {
        const discountShare = returnTotal.div(sale.subtotal).mul(sale.discount);
        returnTotal = returnTotal.sub(discountShare);
      }

      return tx.saleReturn.create({
        data: {
          saleId: sale.id,
          returnedById: user.id,
          total: returnTotal,
          items: {
            create: requested.map((row) => ({
              saleItemId: row.saleItemId,
              quantity: row.quantity,
            })),
          },
        },
        include: { items: true },
      });
    });

    revalidatePath("/medicines");
    revalidatePath("/sales");
    revalidatePath(`/sales/${input.saleId}`);
    revalidatePath("/");
    return ok(saleReturn);
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل الإرجاع";
    return fail(message);
  }
}
