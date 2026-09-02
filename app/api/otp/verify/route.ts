import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp";

export async function POST(req: Request) {
  const { phone, code } = await req.json();

  if (!phone || !code) {
    return NextResponse.json({ error: "الرقم والكود مطلوبين" }, { status: 400 });
  }

  const result = await verifyOtp(phone, code);

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ message: result.message });
}
