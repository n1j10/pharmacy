import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { normalizePhone } from "@/lib/phone";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  secret: process.env.NEXTAUTH_SECRET || "pharmacy_production_super_secret_fallback_key_2026_xyz",
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "OTP",
      credentials: {
        phone: { label: "رقم الهاتف", type: "text" },
        code: { label: "الكود", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code) return null;

        const phone = normalizePhone(credentials.phone);
        if (!phone) return null;

        const result = await verifyOtp(phone, credentials.code);
        if (!result.success) return null;

        const isAdminDemo = phone === "07700000001" || phone === "9647700000001";
        const isSellerDemo = phone === "07700000002" || phone === "9647700000002";

        const possiblePhones = [
          phone,
          ...(phone.startsWith("0") ? [`964${phone.slice(1)}`] : []),
          ...(phone.startsWith("964") ? [`0${phone.slice(3)}`] : []),
        ];

        let user = await prisma.user.findFirst({
          where: {
            phone: { in: possiblePhones },
          },
        });

        if (!user) {
          const existingUsers = await prisma.user.count();
          user = await prisma.user.create({
            data: {
              phone,
              name: isAdminDemo
                ? "مدير النظام"
                : isSellerDemo
                ? "بائع تجريبي"
                : existingUsers === 0
                ? "مدير النظام"
                : "بائع",
              role: isAdminDemo
                ? "ADMIN"
                : isSellerDemo
                ? "SELLER"
                : existingUsers === 0
                ? "ADMIN"
                : "SELLER",
              phoneVerified: new Date(),
            },
          });
        } else {
          if (isAdminDemo && user.role !== "ADMIN") {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { role: "ADMIN", name: "مدير النظام" },
            });
          }
          if (!user.phoneVerified) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { phoneVerified: new Date() },
            });
          }
        }

        return {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        if (user.role) {
          token.role = user.role;
        }
        token.phone = user.phone ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.phone = token.phone;
      }
      return session;
    },
  },
};
