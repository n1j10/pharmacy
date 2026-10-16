"use server";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";

// يجيب المستخدم المسجل. إذا ماكو أحد مسجل دخول يروح لصفحة الدخول.
export const getAuthUser = async () => {
  const access = await requireAuth();
  if (!access.success) redirect("/login");
  return access.user;
};

// نفس getAuthUser بس المدير فقط يكدر يعدي.
export const getAdminUser = async () => {
  const user = await getAuthUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
};
