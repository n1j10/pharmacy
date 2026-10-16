"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { medicineSchema, initialBatchSchema, validateFuctionSchema } from "@/lib/schema";
import { getAuthUser, getAdminUser } from "./user";
import { runAction, orRedirect, contains, availableBatches } from "./helpers";

// الدواء مع فئته ودفعاته (الأقرب للانتهاء أولاً)
const medicineInclude = {
  category: true,
  batches: { orderBy: { expiryDate: "asc" } },
} as const;

// يسوي باركود مثل: PH12345678 + 4 أرقام عشوائية، ويتأكد ما مستخدم (يجرب 5 مرات)
const createUniqueBarcode = async () => {
  for (let i = 0; i < 5; i++) {
    const barcode = `PH${Date.now().toString().slice(-8)}${crypto.randomInt(1000, 9999)}`;

    const exists = await prisma.medicine.findUnique({ where: { barcode } });
    if (!exists) return barcode;
  }
  throw new Error("ما كدرنا نولّد باركود فريد");
};

// فورم الدواء يستخدم بالإنشاء والتعديل (الفارغ يصير null).
const readMedicineForm = (formData: FormData) => {
  const fields = validateFuctionSchema(medicineSchema, Object.fromEntries(formData));

  return {
    name: fields.name,
    description: fields.description || null,
    price: fields.price,
    unit: fields.unit || null,
    manufacturer: fields.manufacturer || null,
    imageUrl: fields.imageUrl || null,
    categoryId: fields.categoryId,
  };
};

// الدفعة الأولى اختيارية: إذا حقل الكمية فارغ ما ننشئ شي.
const readInitialBatch = (formData: FormData) => {
  if (!formData.get("batchQuantity")) return undefined;

  return validateFuctionSchema(initialBatchSchema, {
    quantity: formData.get("batchQuantity"),
    expiryDate: formData.get("batchExpiryDate"),
    costPrice: formData.get("batchCostPrice"),
  });
};

// كل الأدوية. فلاتر اختيارية: بحث بالاسم أو الباركود، و/أو الفئة.
export async function fetchMedicines({
  search,
  categoryId,
}: {
  search?: string;
  categoryId?: string;
} = {}) {
  await getAuthUser();

  return prisma.medicine.findMany({
    where: {
      categoryId: categoryId || undefined,
      OR: search
        ? [{ name: contains(search) }, { barcode: { contains: search } }]
        : undefined,
    },
    include: medicineInclude,
    orderBy: { createdAt: "desc" },
  });
}

// دواء واحد (مع الفئة والدفعات). إذا مو موجود يروح لصفحة الأدوية.
export async function fetchSingleMedicine(id: string) {
  await getAuthUser();

  const medicine = await prisma.medicine.findUnique({
    where: { id },
    include: medicineInclude,
  });
  return orRedirect(medicine, "/medicines");
}

// دواء بالباركود (للبيع). يرجع null إذا مو موجود (بدون redirect حتى ما تنقطع شاشة البيع).
// الدفعات اللي ترجع: المتوفرة وغير المنتهية فقط، الأقرب للانتهاء أولاً.
export async function fetchMedicineByBarcode(barcode: string) {
  await getAuthUser();

  return prisma.medicine.findUnique({
    where: { barcode: barcode.trim() },
    include: {
      category: true,
      batches: { where: availableBatches(), orderBy: { expiryDate: "asc" } },
    },
  });
}

// إضافة دواء جديد. الباركود يتولد تلقائياً، ودفعة أولى اختيارية.
export async function createMedicineAction(prevState: any, formData: FormData) {
  await getAdminUser();

  return runAction(async () => {
    const fields = readMedicineForm(formData);
    const initialBatch = readInitialBatch(formData);

    const category = await prisma.category.findUnique({ where: { id: fields.categoryId } });
    if (!category) throw new Error("الفئة المحددة غير موجودة");

    await prisma.medicine.create({
      data: {
        ...fields,
        barcode: await createUniqueBarcode(),
        // إذا جاي دفعة أولى ننشئها مع الدواء، وإلا undefined (ما ننشئ شي)
        batches: initialBatch ? { create: initialBatch } : undefined,
      },
    });

    revalidatePath("/medicines");
    return "تمت إضافة الدواء بنجاح";
  });
}

// تعديل دواء (الباركود ما يتغير).
export async function updateMedicineAction(prevState: any, formData: FormData) {
  await getAdminUser();

  return runAction(async () => {
    const medicineId = formData.get("id") as string;
    const fields = readMedicineForm(formData);

    await prisma.medicine.update({ where: { id: medicineId }, data: fields });

    revalidatePath("/medicines");
    revalidatePath(`/medicines/${medicineId}`);
    return "تم تعديل الدواء بنجاح";
  });
}

// حذف دواء مع دفعاته.
export async function deleteMedicineAction({ medicineId }: { medicineId: string }) {
  await getAdminUser();

  return runAction(async () => {
    // ماكدر نحذف دواء انباع قبل
    const salesCount = await prisma.saleItem.count({ where: { medicineId } });
    if (salesCount > 0) {
      throw new Error("ماكدر تحذف هذا الدواء، عنده سجل مبيعات سابق");
    }

    // نحذف الدفعات ثم الدواء. $transaction يعني: يا ينحذفون الاثنين يا ولا واحد
    await prisma.$transaction([
      prisma.batch.deleteMany({ where: { medicineId } }),
      prisma.medicine.delete({ where: { id: medicineId } }),
    ]);

    revalidatePath("/medicines");
    return "تم حذف الدواء بنجاح";
  });
}
