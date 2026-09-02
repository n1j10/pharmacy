"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!phone.trim()) {
      setError("رقم الهاتف مطلوب");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "فشل إرسال الكود، حاول مرة ثانية");
      return;
    }

    const data = await res.json();
    if (data.phone) {
      setPhone(data.phone);
    }
    if (data.devCode) {
      setDevCode(data.devCode);
      setCode(data.devCode);
    }

    setStep("code");
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError("الكود مطلوب");
      return;
    }

    setLoading(true);

    const result = await signIn("credentials", {
      phone,
      code,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("الكود غير صحيح أو منتهي الصلاحية");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="login-page" dir="rtl">
      {/* Background decoration */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-30%",
            right: "-10%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            left: "-10%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="login-card" style={{ position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "2rem",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.75rem",
              boxShadow: "0 0 30px rgba(14,165,233,0.35)",
            }}
          >
            💊
          </div>
          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                fontSize: "1.4rem",
                fontWeight: 800,
                color: "#f1f5f9",
                marginBottom: "0.2rem",
              }}
            >
              PharmaSys
            </h1>
            <p style={{ fontSize: "0.825rem", color: "#64748b" }}>
              نظام إدارة الصيدلية
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            justifyContent: "center",
            marginBottom: "1.75rem",
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background:
                step === "phone" || step === "code" ? "#0ea5e9" : "#334155",
              transition: "background 0.3s",
            }}
          />
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background: step === "code" ? "#0ea5e9" : "#334155",
              transition: "background 0.3s",
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: "1.25rem" }}>
            <span>❌</span>
            <span>{error}</span>
          </div>
        )}

        {/* DEV MODE OTP Banner */}
        {devCode && step === "code" && (
          <div
            style={{
              background: "rgba(234,179,8,0.12)",
              border: "1px solid rgba(234,179,8,0.4)",
              borderRadius: 10,
              padding: "0.875rem 1rem",
              marginBottom: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
            }}
          >
            <span style={{ fontSize: "0.75rem", color: "#fbbf24", fontWeight: 700 }}>🛠 DEV MODE — الكود ظاهر فقط في التطوير</span>
            <span style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "0.3em", color: "#fde68a", textAlign: "center" }}>{devCode}</span>
          </div>
        )}

        {/* Phone Step */}
        {step === "phone" && (
          <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="form-group">
              <label className="form-label required">رقم الهاتف</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07xxxxxxxxx"
                className="form-input"
                dir="ltr"
                style={{ textAlign: "left", fontSize: "1rem", letterSpacing: "0.05em" }}
              />
              <span style={{ fontSize: "0.75rem", color: "#475569" }}>
                سيتم إرسال كود التحقق إلى هذا الرقم
              </span>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="btn btn-primary btn-lg btn-full"
            >
              {loading ? (
                <>
                  <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <span>📱</span>
                  <span>إرسال الكود</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Code Step */}
        {step === "code" && (
          <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div
              style={{
                background: "rgba(14,165,233,0.07)",
                border: "1px solid rgba(14,165,233,0.15)",
                borderRadius: 10,
                padding: "0.875rem 1rem",
                fontSize: "0.85rem",
                color: "#7dd3fc",
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
              }}
            >
              <span>📩</span>
              <span>تم إرسال الكود إلى: {phone}</span>
            </div>

            <div className="form-group">
              <label className="form-label required">كود التحقق</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                className="form-input"
                dir="ltr"
                maxLength={6}
                style={{
                  textAlign: "center",
                  letterSpacing: "0.4em",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#0ea5e9",
                }}
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="btn btn-success btn-lg btn-full"
            >
              {loading ? "جاري التحقق..." : "✓ تأكيد الدخول"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
              }}
              className="btn btn-secondary btn-full"
              style={{ fontSize: "0.825rem" }}
            >
              ← تغيير رقم الهاتف
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
