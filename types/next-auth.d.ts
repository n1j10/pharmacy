import { Role } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

// ==========================================
// توسيع (Declaration Merging) لأنواع next-auth
// حتى نكدر نستخدم session.user.id / .role / .phone
// بدون أخطاء TypeScript بكل مكان بالمشروع
// ==========================================

declare module "next-auth" {
  interface User {
    id: string;
    phone?: string | null;
    role?: Role;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      phone: string | null;
      role: Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    phone: string | null;
    role: Role;
  }
}
