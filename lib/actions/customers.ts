"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { customerSchema, validateFuctionSchema } from "@/lib/schema";
import { getAuthUser } from "./user";
import { runAction, orRedirect, contains } from "./helpers";

// هل الرقم مستخدم عند زبون ثاني؟ (exceptId = الزبون الحالي أثناء التعديل)
const isPhoneUsed = async (phone: string, exceptId?: string) => {
  const customer = await prisma.customer.findFirst({
    where: { phone, id: { not: exceptId } },
  });
  return customer !== null;
};

// فورم الزبون يستخدم بالإضافة والتعديل (الفارغ يصير null).
const readCustomerForm = (formData: FormData) => {
  const fields = validateFuctionSchema(customerSchema, Object.fromEntries(formData));

  return {
    name: fields.name,
    phone: fields.phone || null,
    notes: fields.notes || null,
  };
};

// كل الزبائن. فلتر اختياري: بحث بالاسم أو الهاتف.
export async function fetchCustomers(search?: string) {
  await getAuthUser();

  return prisma.customer.findMany({
    where: {
      OR: search
        ? [{ name: contains(search) }, { phone: { contains: search } }]
        : undefined,
    },
    include: { _count: { select: { sales: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// زبون واحد مع آخر 20 فاتورة. إذا مو موجود يروح لصفحة الزبائن.
export async function fetchSingleCustomer(id: string) {
  await getAuthUser();

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { sales: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  return orRedirect(customer, "/customers");
}

// إضافة زبون جديد.
export async function createCustomerAction(prevState: any, formData: FormData) {
  await getAuthUser();

  return runAction(async () => {
    const fields = readCustomerForm(formData);

    if (fields.phone && (await isPhoneUsed(fields.phone))) {
      throw new Error("رقم الهاتف مستخدم مسبقاً");
    }

    await prisma.customer.create({ data: fields });

    revalidatePath("/customers");
    return "تمت إضافة الزبون بنجاح";
  });
}

// تعديل زبون.
export async function updateCustomerAction(prevState: any, formData: FormData) {
  await getAuthUser();

  return runAction(async () => {
    const customerId = formData.get("id") as string;
    const fields = readCustomerForm(formData);

    if (fields.phone && (await isPhoneUsed(fields.phone, customerId))) {
      throw new Error("رقم الهاتف مستخدم مسبقاً");
    }

    await prisma.customer.update({ where: { id: customerId }, data: fields });

    revalidatePath("/customers");
    return "تم تعديل الزبون بنجاح";
  });
}

// حذف زبون.
export async function deleteCustomerAction({ customerId }: { customerId: string }) {
  await getAuthUser();

  return runAction(async () => {
    // ماكدر نحذف زبون عنده فواتير
    const salesCount = await prisma.sale.count({ where: { customerId } });
    if (salesCount > 0) {
      throw new Error("ماكدر تحذف الزبون لأن عنده فواتير سابقة");
    }

    await prisma.customer.delete({ where: { id: customerId } });

    revalidatePath("/customers");
    return "تم حذف الزبون بنجاح";
  });
}
