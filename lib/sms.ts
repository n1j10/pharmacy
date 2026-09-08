export async function sendOtpSms(phone: string, code: string) {
  const deviceId = process.env.TEXTBEE_DEVICE_ID;
  const apiKey = process.env.TEXTBEE_API_KEY;

  if (!deviceId || !apiKey || process.env.DEV_OTP_BYPASS === "true") {
    console.log("\n==============================");
    console.log("🔐 DEV / DEMO OTP BYPASS (No SMS Gateway Configured)");
    console.log(`📱 Phone : ${phone}`);
    console.log(`🔑 Code  : ${code}`);
    console.log("==============================\n");
    return { success: true, dev: true };
  }

  try {
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
      console.warn("SMS Gateway error response:", errorText);
      return { success: false, error: errorText, dev: true };
    }

    return res.json();
  } catch (err) {
    console.error("SMS fetch failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "SMS request failed",
      dev: true,
    };
  }
}
