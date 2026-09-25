"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { SETTINGS_ID } from "@/lib/types";

export async function updateSettings(input: {
  pharmacyName: string;
  phone?: string;
  address?: string;
  receiptFooter?: string;
  currency?: string;
}) {
  const access = await requireAdmin();
  if (!access.success) return access;

  try {
    if (!input.pharmacyName.trim()) {
      return { success: false, error: "اسم الصيدلية مطلوب" } as const;
    }

    const settings = await prisma.pharmacySettings.upsert({
      where: { id: SETTINGS_ID },
      create: {
        id: SETTINGS_ID,
        pharmacyName: input.pharmacyName.trim(),
        phone: input.phone?.trim() || null,
        address: input.address?.trim() || null,
        receiptFooter: input.receiptFooter?.trim() || null,
        currency: input.currency?.trim() || "د.ع",
      },
      update: {
        pharmacyName: input.pharmacyName.trim(),
        phone: input.phone?.trim() || null,
        address: input.address?.trim() || null,
        receiptFooter: input.receiptFooter?.trim() || null,
        currency: input.currency?.trim() || "د.ع",
      },
    });

    revalidatePath("/");
    revalidatePath("/settings");
    revalidatePath("/sales");
    return { success: true, data: settings } as const;
  } catch {
    return { success: false, error: "فشل حفظ الإعدادات" } as const;
  }
}
