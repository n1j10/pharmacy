import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { normalizePhone } from "@/lib/phone";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  secret: process.env.NEXTAUTH_SECRET,
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

        let user = await prisma.user.findUnique({
          where: { phone },
        });

        if (!user) {
          const existingUsers = await prisma.user.count();
          user = await prisma.user.create({
            data: {
              phone,
              name: existingUsers === 0 ? "مدير النظام" : "بائع",
              role: existingUsers === 0 ? "ADMIN" : "SELLER",
              phoneVerified: new Date(),
            },
          });
        } else if (!user.phoneVerified) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { phoneVerified: new Date() },
          });
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
