import { NextResponse } from "next/server";
import { createOtp } from "@/lib/otp";
import { normalizePhone } from "@/lib/phone";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = typeof body.phone === "string" ? body.phone : "";

    if (!normalizePhone(phone)) {
      return NextResponse.json(
        { error: "رقم الهاتف غير صالح. استخدم 07xxxxxxxxx" },
        { status: 400 }
      );
    }

    const result = await createOtp(phone);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if ("devCode" in result && result.devCode) {
      return NextResponse.json({
        message: "تم إنشاء الكود التجريبي",
        phone: result.phone,
        devCode: result.devCode,
      });
    }

    return NextResponse.json({ message: "تم إرسال الكود", phone: result.phone });
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: "فشل إرسال الكود" }, { status: 500 });
  }
}
