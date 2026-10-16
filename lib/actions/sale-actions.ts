"use server";

// إتمام البيع: FEFO (الأقرب للانتهاء أولاً) داخل transaction واحدة.
// ينشئ رقم فاتورة، ينقص الدفعات، ويحفظ SaleDeduction حتى الإرجاع يرجع لنفس الدفعة.

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/session";

type CartItem = {
  barcode: string;
  quantity: number;
};

async function nextInvoiceNumber(tx: Prisma.TransactionClient) {
  const year = new Date().getFullYear();
  const counter = await tx.invoiceCounter.upsert({
    where: { year },
    create: { year, last: 1 },
    update: { last: { increment: 1 } },
  });
  return `INV-${year}-${String(counter.last).padStart(4, "0")}`;
}

export async function createSale(input: {
  items: CartItem[];
  discount?: number;
  paymentMethod?: "CASH" | "CARD";
  customerId?: string | null;
}) {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const sellerId = auth.user.id;
  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller || !seller.isActive) {
    return { success: false, error: "حسابك غير موجود أو معطّل" } as const;
  }

  const merged = new Map<string, number>();
  for (const item of input.items ?? []) {
    const barcode = item.barcode.trim();
    if (!barcode) continue;
    merged.set(barcode, (merged.get(barcode) ?? 0) + item.quantity);
  }
  const items = [...merged.entries()].map(([barcode, quantity]) => ({ barcode, quantity }));

  if (items.length === 0) {
    return { success: false, error: "السلة فارغة" } as const;
  }
  for (const item of items) {
    if (item.quantity <= 0) {
      return { success: false, error: "الكمية يجب تكون أكبر من صفر" } as const;
    }
  }

  const discount = Number(input.discount ?? 0);
  if (discount < 0) {
    return { success: false, error: "الخصم ماكدر يكون سالب" } as const;
  }

  try {
    const sale = await prisma.$transaction(async (tx) => {
      let subtotal = new Prisma.Decimal(0);
      const prepared: {
        medicineId: string;
        quantity: number;
        priceAtSale: Prisma.Decimal;
        deductions: { batchId: string; quantity: number; costPrice: Prisma.Decimal | null }[];
      }[] = [];

      for (const item of items) {
        const medicine = await tx.medicine.findUnique({
          where: { barcode: item.barcode.trim() },
        });
        if (!medicine) {
          throw new Error(`ماكو دواء بهذا الباركود: ${item.barcode}`);
        }

        const batches = await tx.batch.findMany({
          where: {
            medicineId: medicine.id,
            quantity: { gt: 0 },
            expiryDate: { gt: new Date() },
          },
          orderBy: { expiryDate: "asc" },
        });

        const totalAvailable = batches.reduce((sum, b) => sum + b.quantity, 0);
        if (totalAvailable < item.quantity) {
          throw new Error(
            `الكمية المتوفرة من "${medicine.name}" غير كافية (المتوفر: ${totalAvailable}, المطلوب: ${item.quantity})`
          );
        }

        let remainingToDeduct = item.quantity;
        const deductions: {
          batchId: string;
          quantity: number;
          costPrice: Prisma.Decimal | null;
        }[] = [];

        for (const batch of batches) {
          if (remainingToDeduct <= 0) break;
          const deductFromThisBatch = Math.min(batch.quantity, remainingToDeduct);

          await tx.batch.update({
            where: { id: batch.id },
            data: { quantity: { decrement: deductFromThisBatch } },
          });

          deductions.push({
            batchId: batch.id,
            quantity: deductFromThisBatch,
            costPrice: batch.costPrice,
          });
          remainingToDeduct -= deductFromThisBatch;
        }

        subtotal = subtotal.add(medicine.price.mul(item.quantity));
        prepared.push({
          medicineId: medicine.id,
          quantity: item.quantity,
          priceAtSale: medicine.price,
          deductions,
        });
      }

      if (discount > subtotal.toNumber()) {
        throw new Error("الخصم أكبر من مجموع الفاتورة");
      }

      const total = subtotal.sub(new Prisma.Decimal(discount));
      const invoiceNumber = await nextInvoiceNumber(tx);

      const createdSale = await tx.sale.create({
        data: {
          invoiceNumber,
          soldById: sellerId,
          customerId: input.customerId || undefined,
          subtotal,
          discount,
          total,
          paymentMethod: input.paymentMethod ?? "CASH",
          items: {
            create: prepared.map((row) => ({
              medicineId: row.medicineId,
              quantity: row.quantity,
              priceAtSale: row.priceAtSale,
              deductions: {
                create: row.deductions.map((d) => ({
                  batchId: d.batchId,
                  quantity: d.quantity,
                  costPrice: d.costPrice,
                })),
              },
            })),
          },
        },
        include: {
          items: { include: { medicine: true } },
          soldBy: true,
          customer: true,
        },
      });

      return createdSale;
    });

    revalidatePath("/medicines");
    revalidatePath("/sales");
    revalidatePath("/");
    return { success: true, data: sale } as const;
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشلت عملية البيع";
    return { success: false, error: message } as const;
  }
}
