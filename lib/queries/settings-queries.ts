"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { SETTINGS_ID } from "@/lib/types";

export async function getSettings() {
  try {
    const settings = await prisma.pharmacySettings.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: {
        id: SETTINGS_ID,
        pharmacyName: "PharmaSys",
        phone: "",
        address: "",
        receiptFooter: "شكراً لزيارتكم",
        currency: "د.ع",
      },
    });
    return { success: true, data: settings } as const;
  } catch {
    return { success: false, error: "فشل جلب إعدادات الصيدلية" } as const;
  }
}
