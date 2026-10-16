"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { userSchema, registerSchema, validateFuctionSchema } from "@/lib/schema";
import { getAdminUser } from "./user";
import { runAction } from "./helpers";

// مشتركة بين إنشاء موظف وتسجيل حساب:
// تتأكد الإيميل مو مستخدم، وتحفظ المستخدم بالدور المطلوب.
const saveNewUser = async (
  fields: { name: string; email: string; password: string },
  role: Role,
) => {
  const exists = await prisma.user.findUnique({ where: { email: fields.email } });
  if (exists) throw new Error("هذا البريد مستخدم مسبقاً");

  await prisma.user.create({
    data: {
      name: fields.name,
      email: fields.email,
      passwordHash: await bcrypt.hash(fields.password, 12),
      role,
      isActive: true,
    },
  });
};

// كل المستخدمين لصفحة المدير (الأحدث أولاً). بدون كلمة المرور.
export async function fetchUsers() {
  await getAdminUser();

  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

// المدير ينشئ موظف ويحدد دوره.
export async function createUserAction(prevState: any, formData: FormData) {
  await getAdminUser();

  return runAction(async () => {
    const fields = validateFuctionSchema(userSchema, Object.fromEntries(formData));
    await saveNewUser(fields, fields.role as Role);

    revalidatePath("/users");
    return "تم إنشاء الموظف بنجاح";
  });
}

// تسجيل حساب جديد بدون تسجيل دخول. الدور دائماً "بائع".
export async function registerUserAction(prevState: any, formData: FormData) {
  return runAction(async () => {
    const fields = validateFuctionSchema(registerSchema, Object.fromEntries(formData));
    await saveNewUser(fields, "SELLER");

    return "تم إنشاء الحساب بنجاح";
  });
}

// تفعيل أو تعطيل حساب.
export async function setUserActiveAction({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
  const user = await getAdminUser();

  return runAction(async () => {
    // المدير ما يكدر يعطّل حسابه بنفسه
    if (userId === user.id && !isActive) {
      throw new Error("ماكدر تعطّل حسابك الحالي");
    }

    await prisma.user.update({ where: { id: userId }, data: { isActive } });

    revalidatePath("/users");
    return "تم تحديث حالة الحساب";
  });
}
