"use server";

// الزبائن (Customers): إضافة / تعديل / حذف.

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/session";
import { ok, fail } from "./helpers";

type CustomerInput = {
  name: string;
  phone?: string;
  notes?: string;
};

// هل الرقم مستخدم عند زبون ثاني؟ (exceptId = الزبون الحالي أثناء التعديل)
async function isPhoneUsed(phone: string, exceptId?: string) {
  const customer = await prisma.customer.findFirst({
    where: { phone, id: { not: exceptId } },
  });
  return customer !== null;
}

export async function createCustomer(input: CustomerInput) {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const name = input.name.trim();
  const phone = input.phone?.trim() || null;
  const notes = input.notes?.trim() || null;

  if (!name) {
    return fail("اسم الزبون مطلوب");
  }

  try {
    if (phone && (await isPhoneUsed(phone))) {
      return fail("رقم الهاتف مستخدم مسبقاً");
    }

    const customer = await prisma.customer.create({
      data: { name, phone, notes },
    });

    revalidatePath("/customers");
    return ok(customer);
  } catch {
    return fail("فشل إضافة الزبون");
  }
}

export async function updateCustomer(id: string, input: CustomerInput) {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const name = input.name.trim();
  const phone = input.phone?.trim() || null;
  const notes = input.notes?.trim() || null;

  if (!name) {
    return fail("اسم الزبون مطلوب");
  }

  try {
    if (phone && (await isPhoneUsed(phone, id))) {
      return fail("رقم الهاتف مستخدم مسبقاً");
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: { name, phone, notes },
    });

    revalidatePath("/customers");
    return ok(customer);
  } catch {
    return fail("فشل تعديل الزبون");
  }
}

export async function deleteCustomer(id: string) {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  try {
    // ماكدر نحذف زبون عنده فواتير
    const salesCount = await prisma.sale.count({ where: { customerId: id } });
    if (salesCount > 0) {
      return fail("ماكدر تحذف الزبون لأن عنده فواتير سابقة");
    }

    await prisma.customer.delete({ where: { id } });

    revalidatePath("/customers");
    return ok();
  } catch {
    return fail("فشل حذف الزبون");
  }
}
