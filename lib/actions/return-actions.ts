"use server";

// إرجاع كامل أو جزئي: نعيد الكمية لنفس الدفعات المخزّنة في SaleDeduction.

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/session";

export async function createSaleReturn(input: {
  saleId: string;
  items: { saleItemId: string; quantity: number }[];
}) {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const user = auth.user;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: input.saleId },
        include: {
          items: {
            include: {
              deductions: { orderBy: { id: "desc" } },
              returnItems: true,
              medicine: true,
            },
          },
        },
      });

      if (!sale) {
        throw new Error("الفاتورة غير موجودة");
      }
      if (user.role !== "ADMIN" && sale.soldById !== user.id) {
        throw new Error("ما عندك صلاحية ترجع هذي الفاتورة");
      }

      const requested = (input.items ?? []).filter((i) => i.quantity > 0);
      if (requested.length === 0) {
        throw new Error("حدد كمية للإرجاع");
      }

      let returnTotal = new Prisma.Decimal(0);

      for (const row of requested) {
        const saleItem = sale.items.find((i) => i.id === row.saleItemId);
        if (!saleItem) {
          throw new Error("صنف الفاتورة غير موجود");
        }

        const alreadyReturned = saleItem.returnItems.reduce((s, r) => s + r.quantity, 0);
        const remaining = saleItem.quantity - alreadyReturned;
        if (row.quantity > remaining) {
          throw new Error(
            `كمية الإرجاع لـ "${saleItem.medicine.name}" أكبر من المتبقي (${remaining})`
          );
        }

        let left = row.quantity;
        for (const deduction of saleItem.deductions) {
          if (left <= 0) break;
          const restorable = deduction.quantity - deduction.returnedQuantity;
          if (restorable <= 0) continue;
          const take = Math.min(restorable, left);

          await tx.batch.update({
            where: { id: deduction.batchId },
            data: { quantity: { increment: take } },
          });
          await tx.saleDeduction.update({
            where: { id: deduction.id },
            data: { returnedQuantity: { increment: take } },
          });
          left -= take;
        }

        returnTotal = returnTotal.add(saleItem.priceAtSale.mul(row.quantity));
      }

      if (Number(sale.subtotal) > 0 && Number(sale.discount) > 0) {
        const share = returnTotal.div(sale.subtotal).mul(sale.discount);
        returnTotal = returnTotal.sub(share);
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
    return { success: true, data: result } as const;
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل الإرجاع";
    return { success: false, error: message } as const;
  }
}
