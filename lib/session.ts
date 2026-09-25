import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    return { success: false as const, error: "لازم تكون مسجل دخول" };
  }
  return { success: true as const, user };
}

export async function requireAdmin() {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  if (auth.user.role !== "ADMIN") {
    return { success: false as const, error: "هذي العملية للمدير فقط" };
  }
  return auth;
}
