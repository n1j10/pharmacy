"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Pill,
  Phone,
  KeyRound,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.trim().replace(/\s+/g, "");
    if (!cleanPhone) {
      setError("يرجى إدخال رقم الهاتف للمتابعة");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone }),
      });

      setLoading(false);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          typeof data.error === "string"
            ? data.error
            : "تعذر إرسال رمز التحقق، يرجى التأكد من الرقم والمحاولة لاحقاً"
        );
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
    } catch {
      setLoading(false);
      setError("حدث خطأ أثناء الاتصال بالخادم، يرجى المحاولة مرة أخرى");
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim();
    if (!cleanCode) {
      setError("يرجى إدخال رمز التحقق المكون من 6 أرقام");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        phone,
        code: cleanCode,
        redirect: false,
      });

      setLoading(false);

      if (result?.error) {
        setError("رمز التحقق غير صحيح أو قد انتهت صلاحيته");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setLoading(false);
      setError("حدث خطأ غير متوقع أثناء تسجيل الدخول");
    }
  }

  const copyDevCode = () => {
    if (!devCode) return;
    navigator.clipboard.writeText(devCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950 p-4 sm:p-6 md:p-8"
    >
      {/* Ambient background glow & subtle grid */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-sky-600/5 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="relative w-full max-w-md py-6">
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="group relative mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 via-sky-600 to-indigo-600 p-0.5 shadow-xl shadow-sky-500/20 ring-1 ring-white/20 transition-all duration-300 hover:scale-105">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950/40 backdrop-blur-xs">
              <Pill className="h-8 w-8 text-sky-300 transition-transform duration-300 group-hover:rotate-12" />
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            فارما سيس{" "}
            <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
              PharmaSys
            </span>
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-400">
            المنظومة الذكية لإدارة الصيدليات والمخزون
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-5 flex items-center justify-center gap-2">
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              step === "phone"
                ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                : "bg-slate-800/80 text-slate-400 border border-slate-700/50"
            }`}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                step === "phone"
                  ? "bg-sky-500 text-slate-950 font-bold"
                  : "bg-slate-700 text-slate-300"
              }`}
            >
              1
            </span>
            <span>رقم الهاتف</span>
          </div>

          <div className="h-0.5 w-6 rounded-full bg-slate-800" />

          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              step === "code"
                ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                : "bg-slate-800/80 text-slate-400 border border-slate-700/50"
            }`}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                step === "code"
                  ? "bg-sky-500 text-slate-950 font-bold"
                  : "bg-slate-700 text-slate-300"
              }`}
            >
              2
            </span>
            <span>رمز التأكيد</span>
          </div>
        </div>

        {/* Main Card */}
        <Card className="border-slate-800/80 bg-slate-900/80 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
          <CardHeader className="space-y-1 pb-4 text-center sm:text-right">
            <CardTitle className="text-xl font-bold text-white">
              {step === "phone" ? "تسجيل الدخول" : "تأكيد الرمز"}
            </CardTitle>
            <CardDescription className="text-slate-400 text-sm">
              {step === "phone"
                ? "أدخل رقم هاتفك لتسجيل الدخول أو استلام رمز التحقق السريع"
                : `تم إرسال رمز التأكيد إلى الرقم ${phone}`}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Error Notification */}
            {error && (
              <Alert
                variant="destructive"
                className="border-red-500/30 bg-red-950/40 text-red-200"
              >
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <AlertDescription className="text-xs font-medium leading-relaxed pr-2">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Dev Mode OTP Banner */}
            {devCode && step === "code" && (
              <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                    <Sparkles className="h-4 w-4" />
                    <span>وضع المطور (DEV MODE)</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={copyDevCode}
                    className="h-7 px-2 text-xs text-amber-300 hover:bg-amber-500/20 hover:text-amber-200"
                  >
                    {copied ? (
                      <>
                        <Check className="ml-1 h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="ml-1 h-3.5 w-3.5" />
                        <span>نسخ الرمز</span>
                      </>
                    )}
                  </Button>
                </div>
                <div className="mt-2 flex items-center justify-center">
                  <span className="font-mono text-3xl font-extrabold tracking-[0.35em] text-amber-300 drop-shadow">
                    {devCode}
                  </span>
                </div>
                <p className="mt-1 text-center text-[11px] text-amber-400/80">
                  تم توليد هذا الرمز تلقائياً للاختبار في البيئة التجريبية
                </p>
              </div>
            )}

            {/* Step 1: Phone Form */}
            {step === "phone" && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="phone-input"
                      className="text-sm font-medium text-slate-200"
                    >
                      رقم الهاتف
                    </Label>
                    <span className="text-xs text-sky-400 font-medium">
                      مطلوب
                    </span>
                  </div>

                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <Input
                      id="phone-input"
                      dir="ltr"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="07xxxxxxxxx"
                      disabled={loading}
                      autoFocus
                      className="h-11 border-slate-700/80 bg-slate-950/60 pr-10 text-left font-medium tracking-wider text-white placeholder:text-slate-500 focus-visible:border-sky-500 focus-visible:ring-sky-500/30"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    أدخل رقم الهاتف العراقي (مثال: 07700000000 أو 07800000000)
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full bg-gradient-to-r from-sky-500 to-indigo-600 font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      <span>جاري إرسال الرمز...</span>
                    </>
                  ) : (
                    <>
                      <span>إرسال رمز التحقق</span>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Step 2: Verification Code Form */}
            {step === "code" && (
              <form onSubmit={handleVerify} className="space-y-4">
                {/* Active Phone Display */}
                <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 px-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-400">الرقم المدخل:</span>
                    <span
                      dir="ltr"
                      className="font-mono font-bold text-sky-400"
                    >
                      {phone}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStep("phone");
                      setCode("");
                      setError(null);
                    }}
                    className="h-6 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    <RotateCcw className="ml-1 h-3 w-3" />
                    <span>تغيير</span>
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="code-input"
                      className="text-sm font-medium text-slate-200"
                    >
                      رمز التحقق (OTP)
                    </Label>
                    <span className="text-xs text-slate-400 font-mono">
                      6 أرقام
                    </span>
                  </div>

                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <Input
                      id="code-input"
                      dir="ltr"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••••"
                      disabled={loading}
                      autoFocus
                      className="h-12 border-slate-700/80 bg-slate-950/60 pr-10 text-center font-mono text-2xl font-bold tracking-[0.4em] text-sky-400 placeholder:tracking-normal placeholder:text-slate-600 focus-visible:border-sky-500 focus-visible:ring-sky-500/30"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full bg-gradient-to-r from-emerald-500 to-teal-600 font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      <span>جاري التحقق والدخول...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="ml-2 h-5 w-5" />
                      <span>تأكيد ومتابعة الدخول</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep("phone");
                    setCode("");
                    setError(null);
                  }}
                  className="h-10 w-full border-slate-800 bg-slate-900/50 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  <span>الرجوع لتعديل رقم الهاتف</span>
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col items-center justify-center border-t border-slate-800/80 pt-4 text-center">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
              <span>نظام محمي ومشفر بالكامل وفق أعلى معايير الأمان</span>
            </div>
          </CardFooter>
        </Card>

        {/* Footer Note */}
        <p className="mt-6 text-center text-xs text-slate-500">
          جميع الحقوق محفوظة © {new Date().getFullYear()} نظام إدارة الصيدليات PharmaSys
        </p>
      </div>
    </div>
  );
}
