export async function sendOtpSms(phone: string, code: string) {
  if (process.env.DEV_OTP_BYPASS === "true") {
    console.log("\n==============================");
    console.log("🔐 DEV OTP BYPASS");
    console.log(`📱 Phone : ${phone}`);
    console.log(`🔑 Code  : ${code}`);
    console.log("==============================\n");
    return { success: true, dev: true };
  }

  const deviceId = process.env.TEXTBEE_DEVICE_ID;
  const apiKey = process.env.TEXTBEE_API_KEY;

  if (!deviceId || !apiKey) {
    throw new Error("إعدادات إرسال SMS غير مكتملة");
  }

  const res = await fetch(
    `https://api.textbee.dev/api/v1/gateway/devices/${deviceId}/send-sms`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        recipients: [phone],
        message: `رمز التحقق الخاص بك هو: ${code}\nصالح لمدة 5 دقائق.`,
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`فشل إرسال الرسالة: ${errorText}`);
  }

  return res.json();
}
