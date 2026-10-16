"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/session";
import type { Role } from "@prisma/client";

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
}) {
  const access = await requireAdmin();
  if (!access.success) return access;

  try {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    if (!name) return { success: false, error: "الاسم مطلوب" } as const;
    if (!email) return { success: false, error: "البريد الإلكتروني مطلوب" } as const;
    if (!input.password || input.password.length < 6) {
      return { success: false, error: "كلمة المرور يجب تكون 6 أحرف على الأقل" } as const;
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return { success: false, error: "هذا البريد مستخدم مسبقاً" } as const;
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await bcrypt.hash(input.password, 12),
        role: input.role,
        isActive: true,
      },
    });

    revalidatePath("/users");
    return { success: true, data: { id: user.id } } as const;
  } catch (err) {
    console.error("createUser error:", err);
    return { success: false, error: "فشل إنشاء الموظف" } as const;
  }
}

// تسجيل حساب جديد بشكل عام (بدون تسجيل دخول). الدور دائماً "بائع".
export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  try {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    if (!name) return { success: false, error: "الاسم مطلوب" } as const;
    if (!email) return { success: false, error: "البريد الإلكتروني مطلوب" } as const;
    if (!input.password || input.password.length < 6) {
      return { success: false, error: "كلمة المرور يجب تكون 6 أحرف على الأقل" } as const;
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return { success: false, error: "هذا البريد مستخدم مسبقاً" } as const;
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await bcrypt.hash(input.password, 12),
        role: "SELLER",
        isActive: true,
      },
    });

    return { success: true, data: { id: user.id, email: user.email } } as const;
  } catch (err) {
    console.error("registerUser error:", err);
    return { success: false, error: "فشل إنشاء الحساب" } as const;
  }
}

export async function setUserActive(id: string, isActive: boolean) {
  const access = await requireAdmin();
  if (!access.success) return access;

  try {
    if (id === access.user.id && !isActive) {
      return { success: false, error: "ماكدر تعطّل حسابك الحالي" } as const;
    }

    await prisma.user.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath("/users");
    return { success: true, data: undefined } as const;
  } catch {
    return { success: false, error: "فشل تحديث حالة الحساب" } as const;
  }
}
