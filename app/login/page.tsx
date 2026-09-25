"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  KeyRound,
  Loader2,
  Mail,
  Pill,
  ShieldCheck,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
      return;
    }
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("حدث خطأ غير متوقع أثناء تسجيل الدخول.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      dir="rtl"
      className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-slate-950 p-4"
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-xl shadow-sky-500/20">
            <Pill className="h-8 w-8 text-sky-100" />
          </div>
          <h1 className="text-2xl font-black text-white">
            فارما سيس <span className="text-sky-400">PharmaSys</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            المنظومة الذكية لإدارة الصيدليات والمخزون
          </p>
        </div>
        <Card className="border-slate-800 bg-slate-900/80 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold text-white">
              تسجيل الدخول
            </CardTitle>
            <CardDescription className="text-slate-400">
              أدخل بيانات حسابك للمتابعة.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert
                  variant="destructive"
                  className="border-red-500/30 bg-red-950/40 text-red-200"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">
                  البريد الإلكتروني
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    dir="ltr"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    disabled={loading}
                    autoFocus
                    className="h-11 border-slate-700 bg-slate-950/60 pr-10 text-left text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    dir="ltr"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="h-11 border-slate-700 bg-slate-950/60 pr-10 text-left text-white"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full bg-gradient-to-r from-sky-500 to-indigo-600 font-bold text-white hover:from-sky-400 hover:to-indigo-500"
              >
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جارٍ تسجيل الدخول...
                  </>
                ) : (
                  "تسجيل الدخول"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="border-t border-slate-800 pt-4">
            <div className="flex w-full items-center justify-center gap-1.5 text-xs text-slate-400">
              <span>ماعندك حساب؟</span>
              <Link href="/register" className="font-semibold text-sky-400 hover:text-sky-300">
                إنشاء حساب جديد
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
