"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { batchSchema, batchUpdateSchema, validateFuctionSchema } from "@/lib/schema";
import { getAdminUser } from "./user";
import { runAction } from "./helpers";

// الدفعات (Batches): كل دفعة إلها كمية وتاريخ انتهاء وسعر تكلفة.
// المدير فقط يكدر يضيف / يعدل / يحذف.
// (قراءة الدفعات تجي مع fetchSingleMedicine بملف medicines.ts)

// تحديث صفحات الأدوية بعد أي تغيير بالدفعات
const refreshMedicinePages = (medicineId: string) => {
  revalidatePath("/medicines");
  revalidatePath(`/medicines/${medicineId}`);
};

// إضافة دفعة لدواء.
export async function createBatchAction(prevState: any, formData: FormData) {
  await getAdminUser();

  return runAction(async () => {
    const fields = validateFuctionSchema(batchSchema, Object.fromEntries(formData));

    const medicine = await prisma.medicine.findUnique({ where: { id: fields.medicineId } });
    if (!medicine) throw new Error("الدواء غير موجود");

    await prisma.batch.create({ data: fields });

    refreshMedicinePages(fields.medicineId);
    return "تمت إضافة الدفعة بنجاح";
  });
}

// تعديل دفعة (الكمية، تاريخ الانتهاء، سعر التكلفة).
export async function updateBatchAction(prevState: any, formData: FormData) {
  await getAdminUser();

  return runAction(async () => {
    const batchId = formData.get("id") as string;
    const fields = validateFuctionSchema(batchUpdateSchema, Object.fromEntries(formData));

    const batch = await prisma.batch.update({ where: { id: batchId }, data: fields });

    refreshMedicinePages(batch.medicineId);
    return "تم تعديل الدفعة بنجاح";
  });
}

// حذف دفعة.
export async function deleteBatchAction({ batchId }: { batchId: string }) {
  await getAdminUser();

  return runAction(async () => {
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw new Error("الدفعة غير موجودة");

    // إذا الدفعة انباع منها قبل، ماكدر نحذفها
    const salesCount = await prisma.saleDeduction.count({ where: { batchId } });
    if (salesCount > 0) {
      throw new Error("ماكدر تحذف هذي الدفعة لأنها مرتبطة بمبيعات");
    }

    await prisma.batch.delete({ where: { id: batchId } });

    refreshMedicinePages(batch.medicineId);
    return "تم حذف الدفعة بنجاح";
  });
}
