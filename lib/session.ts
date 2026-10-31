import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  // JWT sessions are stateless: re-check the account on every server call so a
  // deactivated user or a demoted admin loses access immediately, not when the token expires.
  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true, role: true },
  });
  if (!account?.isActive) return null;

  return { ...session.user, role: account.role };
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
