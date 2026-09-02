import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendOtpSms } from "@/lib/sms";
import { normalizePhone } from "@/lib/phone";

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_WINDOW = 5;
const SEND_WINDOW_MS = 15 * 60 * 1000;

export function generateOtpCode(): string {
  if (process.env.DEV_OTP_BYPASS === "true") {
    return "123456";
  }
  return crypto.randomInt(100000, 999999).toString();
}

export async function createOtp(rawIdentifier: string) {
  const identifier = normalizePhone(rawIdentifier);
  if (!identifier) {
    return { success: false as const, error: "رقم الهاتف غير صالح. استخدم 07xxxxxxxxx" };
  }

  const recentCount = await prisma.otpCode.count({
    where: {
      identifier,
      createdAt: { gte: new Date(Date.now() - SEND_WINDOW_MS) },
    },
  });

  if (recentCount >= MAX_SENDS_PER_WINDOW) {
    return {
      success: false as const,
      error: "تجاوزت عدد محاولات إرسال الكود. حاول بعد ربع ساعة.",
    };
  }

  const code = generateOtpCode();
  const hashedCode = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpCode.deleteMany({
    where: { identifier, consumed: false },
  });

  await prisma.otpCode.create({
    data: { identifier, code: hashedCode, expiresAt },
  });

  await sendOtpSms(identifier, code);

  return {
    success: true as const,
    phone: identifier,
    ...(process.env.DEV_OTP_BYPASS === "true" ? { devCode: code } : {}),
  };
}

export async function verifyOtp(rawIdentifier: string, code: string) {
  const identifier = normalizePhone(rawIdentifier) ?? rawIdentifier.trim();

  if (
    process.env.DEV_OTP_BYPASS === "true" &&
    (code === "123456" || code === "000000")
  ) {
    return { success: true, message: "تم التحقق بنجاح (كود تجريبي)", phone: identifier } as const;
  }

  const otp = await prisma.otpCode.findFirst({
    where: { identifier, consumed: false },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return { success: false, message: "ماكو كود مرسل لهذا الرقم" } as const;
  }

  if (otp.expiresAt < new Date()) {
    return { success: false, message: "انتهت صلاحية الكود" } as const;
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    return { success: false, message: "تجاوزت عدد المحاولات المسموحة" } as const;
  }

  const isValid = await bcrypt.compare(code, otp.code);

  if (!isValid) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return { success: false, message: "الكود غير صحيح" } as const;
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { consumed: true },
  });

  return { success: true, message: "تم التحقق بنجاح", phone: identifier } as const;
}
