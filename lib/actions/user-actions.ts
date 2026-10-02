"use server";

// المستخدمين: إنشاء موظف (مدير)، تسجيل حساب عام، وتفعيل/تعطيل حساب.

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/session";
import type { Role } from "@prisma/client";
import { ok, fail } from "./helpers";

// الدالة المشتركة بين createUser و registerUser:
// تتحقق من البيانات وتحفظ المستخدم بالدور المطلوب.
async function saveNewUser(
  input: { name: string; email: string; password: string },
  role: Role
) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (!name) return fail("الاسم مطلوب");
  if (!email) return fail("البريد الإلكتروني مطلوب");
  if (!input.password || input.password.length < 6) {
    return fail("كلمة المرور يجب تكون 6 أحرف على الأقل");
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return fail("هذا البريد مستخدم مسبقاً");
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(input.password, 12),
      role,
      isActive: true,
    },
  });

  return ok({ id: user.id, email: user.email });
}

// المدير ينشئ موظف ويحدد دوره
export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
}) {
  const access = await requireAdmin();
  if (!access.success) return access;

  try {
    const result = await saveNewUser(input, input.role);
    if (result.success) revalidatePath("/users");
    return result;
  } catch (err) {
    console.error("createUser error:", err);
    return fail("فشل إنشاء الموظف");
  }
}

// تسجيل حساب جديد بدون تسجيل دخول. الدور دائماً "بائع".
export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  try {
    return await saveNewUser(input, "SELLER");
  } catch (err) {
    console.error("registerUser error:", err);
    return fail("فشل إنشاء الحساب");
  }
}

export async function setUserActive(id: string, isActive: boolean) {
  const access = await requireAdmin();
  if (!access.success) return access;

  // المدير ما يكدر يعطّل حسابه بنفسه
  if (id === access.user.id && !isActive) {
    return fail("ماكدر تعطّل حسابك الحالي");
  }

  try {
    await prisma.user.update({ where: { id }, data: { isActive } });

    revalidatePath("/users");
    return ok();
  } catch {
    return fail("فشل تحديث حالة الحساب");
  }
}
