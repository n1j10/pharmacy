"use server";

// إتمام البيع. الفكرة:
// 1) نتحقق من السلة.
// 2) نسحب الكمية من الدفعات بنظام FEFO (الأقرب للانتهاء أولاً).
// 3) نسجل من أي دفعة انسحب (SaleDeduction) حتى الإرجاع يرجع لنفس الدفعة.
// كل شي داخل transaction واحدة: إذا صار أي خطأ، ما ينحفظ شي.

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import type { Medicine } from "@prisma/client";
import { requireAuth } from "@/lib/session";
import { ok, fail } from "./helpers";

type CartItem = {
  barcode: string;
  quantity: number;
};

// إذا نفس الباركود انكرر بالسلة نجمع كمياته بسطر واحد
function mergeCartItems(items: CartItem[]) {
  const quantities = new Map<string, number>();

  for (const item of items) {
    const barcode = item.barcode.trim();
    if (!barcode) continue;
    quantities.set(barcode, (quantities.get(barcode) ?? 0) + item.quantity);
  }

  return [...quantities].map(([barcode, quantity]) => ({ barcode, quantity }));
}

// رقم الفاتورة مثل: INV-2026-0001 (العداد يبدأ من جديد كل سنة)
async function nextInvoiceNumber(tx: Prisma.TransactionClient) {
  const year = new Date().getFullYear();

  const counter = await tx.invoiceCounter.upsert({
    where: { year },
    create: { year, last: 1 },
    update: { last: { increment: 1 } },
  });

  return `INV-${year}-${String(counter.last).padStart(4, "0")}`;
}

// ينقص الكمية من دفعات الدواء (الأقرب للانتهاء أولاً)
// ويرجع قائمة بالدفعات اللي انسحب منها.
async function takeFromBatches(
  tx: Prisma.TransactionClient,
  medicine: Medicine,
  quantity: number
) {
  // الدفعات المتوفرة وغير المنتهية، مرتبة حسب تاريخ الانتهاء
  const batches = await tx.batch.findMany({
    where: {
      medicineId: medicine.id,
      quantity: { gt: 0 },
      expiryDate: { gt: new Date() },
    },
    orderBy: { expiryDate: "asc" },
  });

  const available = batches.reduce((sum, batch) => sum + batch.quantity, 0);
  if (available < quantity) {
    throw new Error(
      `الكمية المتوفرة من "${medicine.name}" غير كافية (المتوفر: ${available}, المطلوب: ${quantity})`
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

    deductions.push({
      batchId: batch.id,
      quantity: take,
      costPrice: batch.costPrice,
    });
    left -= take;
  }

  return deductions;
}

export async function createSale(input: {
  items: CartItem[];
  discount?: number;
  paymentMethod?: "CASH" | "CARD";
  customerId?: string | null;
}) {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  // نتأكد البائع موجود وحسابه مفعّل
  const sellerId = auth.user.id;
  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller || !seller.isActive) {
    return fail("حسابك غير موجود أو معطّل");
  }

  // التحقق من السلة والخصم
  const items = mergeCartItems(input.items ?? []);
  if (items.length === 0) {
    return fail("السلة فارغة");
  }
  if (items.some((item) => item.quantity <= 0)) {
    return fail("الكمية يجب تكون أكبر من صفر");
  }

  const discount = Number(input.discount ?? 0);
  if (discount < 0) {
    return fail("الخصم ماكدر يكون سالب");
  }

  try {
    const sale = await prisma.$transaction(async (tx) => {
      let subtotal = new Prisma.Decimal(0);
      const saleItems: Prisma.SaleItemUncheckedCreateWithoutSaleInput[] = [];

      // نمر على كل دواء بالسلة
      for (const item of items) {
        const medicine = await tx.medicine.findUnique({
          where: { barcode: item.barcode },
        });
        if (!medicine) {
          throw new Error(`ماكو دواء بهذا الباركود: ${item.barcode}`);
        }

        const deductions = await takeFromBatches(tx, medicine, item.quantity);

        subtotal = subtotal.add(medicine.price.mul(item.quantity));
        saleItems.push({
          medicineId: medicine.id,
          quantity: item.quantity,
          priceAtSale: medicine.price, // نحفظ السعر وقت البيع
          deductions: { create: deductions },
        });
      }

      if (discount > subtotal.toNumber()) {
        throw new Error("الخصم أكبر من مجموع الفاتورة");
      }

      return tx.sale.create({
        data: {
          invoiceNumber: await nextInvoiceNumber(tx),
          soldById: sellerId,
          customerId: input.customerId || undefined,
          subtotal,
          discount,
          total: subtotal.sub(discount),
          paymentMethod: input.paymentMethod ?? "CASH",
          items: { create: saleItems },
        },
        include: {
          items: { include: { medicine: true } },
          soldBy: true,
          customer: true,
        },
      });
    });

    revalidatePath("/medicines");
    revalidatePath("/sales");
    revalidatePath("/");
    return ok(sale);
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشلت عملية البيع";
    return fail(message);
  }
}
