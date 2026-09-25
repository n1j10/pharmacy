"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/session";

export async function createCustomer(input: {
  name: string;
  phone?: string;
  notes?: string;
}) {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  try {
    const name = input.name.trim();
    if (!name) return { success: false, error: "اسم الزبون مطلوب" } as const;

    const phone = input.phone?.trim() || null;
    if (phone) {
      const exists = await prisma.customer.findUnique({ where: { phone } });
      if (exists) {
        return { success: false, error: "رقم الهاتف مستخدم مسبقاً" } as const;
      }
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        notes: input.notes?.trim() || null,
      },
    });

    revalidatePath("/customers");
    return { success: true, data: customer } as const;
  } catch {
    return { success: false, error: "فشل إضافة الزبون" } as const;
  }
}

export async function updateCustomer(
  id: string,
  input: { name: string; phone?: string; notes?: string }
) {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  try {
    const name = input.name.trim();
    if (!name) return { success: false, error: "اسم الزبون مطلوب" } as const;

    const phone = input.phone?.trim() || null;
    if (phone) {
      const duplicate = await prisma.customer.findFirst({
        where: { phone, NOT: { id } },
      });
      if (duplicate) {
        return { success: false, error: "رقم الهاتف مستخدم مسبقاً" } as const;
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: { name, phone, notes: input.notes?.trim() || null },
    });

    revalidatePath("/customers");
    return { success: true, data: customer } as const;
  } catch {
    return { success: false, error: "فشل تعديل الزبون" } as const;
  }
}

export async function deleteCustomer(id: string) {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  try {
    const salesCount = await prisma.sale.count({ where: { customerId: id } });
    if (salesCount > 0) {
      return {
        success: false,
        error: "ماكدر تحذف الزبون لأن عنده فواتير سابقة",
      } as const;
    }

    await prisma.customer.delete({ where: { id } });
    revalidatePath("/customers");
    return { success: true, data: undefined } as const;
  } catch {
    return { success: false, error: "فشل حذف الزبون" } as const;
  }
}
