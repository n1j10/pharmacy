"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { SETTINGS_ID } from "@/lib/types";
import { settingsSchema, validateFuctionSchema } from "@/lib/schema";
import { getAuthUser, getAdminUser } from "./user";
import { runAction } from "./helpers";

// إعدادات الصيدلية (سجل واحد فقط ID ثابت).

// الإعدادات (اسم الصيدلية، العملة، ذيل الفاتورة...). يرجع null إذا ما انحفظت قبل.
export async function fetchSettings() {
  await getAuthUser();
  return prisma.pharmacySettings.findUnique({ where: { id: SETTINGS_ID } });
}

// حفظ الإعدادات (المدير فقط).
export async function updateSettingsAction(prevState: any, formData: FormData) {
  await getAdminUser();

  return runAction(async () => {
    const fields = validateFuctionSchema(settingsSchema, Object.fromEntries(formData));

    // القيم بعد التنظيف (الفارغ يصير null، والعملة الافتراضية د.ع)
    const data = {
      pharmacyName: fields.pharmacyName,
      phone: fields.phone || null,
      address: fields.address || null,
      receiptFooter: fields.receiptFooter || null,
      currency: fields.currency || "د.ع",
    };

    // upsert = إذا السجل موجود يعدله، وإذا مو موجود ينشئه
    await prisma.pharmacySettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...data },
      update: data,
    });

    revalidatePath("/");
    revalidatePath("/settings");
    revalidatePath("/sales");
    return "تم حفظ الإعدادات بنجاح";
  });
}

// ---- قراءات الصفحات ----
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
