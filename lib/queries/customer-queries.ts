"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function getCustomers(search?: string) {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  try {
    const q = search?.trim();
    const customers = await prisma.customer.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: customers } as const;
  } catch {
    return { success: false, error: "فشل جلب الزبائن" } as const;
  }
}

export async function getCustomerById(id: string) {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });
    if (!customer) {
      return { success: false, error: "الزبون غير موجود" } as const;
    }
    return { success: true, data: customer } as const;
  } catch {
    return { success: false, error: "فشل جلب الزبون" } as const;
  }
}
