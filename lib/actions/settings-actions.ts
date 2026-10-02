"use server";

// إعدادات الصيدلية (سجل واحد فقط ID ثابت).

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { SETTINGS_ID } from "@/lib/types";
import { ok, fail } from "./helpers";

export async function updateSettings(input: {
  pharmacyName: string;
  phone?: string;
  address?: string;
  receiptFooter?: string;
  currency?: string;
}) {
  const access = await requireAdmin();
  if (!access.success) return access;

  const pharmacyName = input.pharmacyName.trim();
  if (!pharmacyName) {
    return fail("اسم الصيدلية مطلوب");
  }

  // القيم بعد التنظيف (الفارغ يصير null، والعملة الافتراضية د.ع)
  const data = {
    pharmacyName,
    phone: input.phone?.trim() || null,
    address: input.address?.trim() || null,
    receiptFooter: input.receiptFooter?.trim() || null,
    currency: input.currency?.trim() || "د.ع",
  };

  try {
    // upsert = إذا السجل موجود يعدله، وإذا مو موجود ينشئه
    const settings = await prisma.pharmacySettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...data },
      update: data,
    });

    revalidatePath("/");
    revalidatePath("/settings");
    revalidatePath("/sales");
    return ok(settings);
  } catch {
    return fail("فشل حفظ الإعدادات");
  }
}
