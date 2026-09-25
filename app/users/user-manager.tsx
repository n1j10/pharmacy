"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser, setUserActive } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus, UserCircle2, ShieldCheck, Ban, CheckCircle2 } from "lucide-react";

type Role = "ADMIN" | "SELLER";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  isActive: boolean;
  createdAt: Date | string;
};

export default function UserManager({ users }: { users: UserRow[] }) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("SELLER");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setError("الاسم والبريد وكلمة المرور كلها مطلوبة");
      return;
    }

    setLoading(true);
    const result = await createUser({ name, email, password, role });
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setName("");
    setEmail("");
    setPassword("");
    setRole("SELLER");
    router.refresh();
  }

  async function toggleActive(user: UserRow) {
    setError(null);
    setBusyId(user.id);
    const result = await setUserActive(user.id, !user.isActive);
    setBusyId(null);

    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Add form */}
      <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">الاسم</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم الموظف"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            dir="ltr"
            className="mt-1 text-left"
          />
        </div>
        <div>
          <Label htmlFor="password">كلمة المرور</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6 أحرف على الأقل"
            dir="ltr"
            className="mt-1 text-left"
          />
        </div>
        <div>
          <Label htmlFor="role">الدور</Label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="SELLER">بائع</option>
            <option value="ADMIN">مدير</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={loading} className="gap-2">
            <Plus className="w-4 h-4" />
            {loading ? "جاري الإضافة..." : "إضافة موظف"}
          </Button>
        </div>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* List */}
      <div className="border border-border/50 rounded-xl overflow-hidden bg-background/50">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UserCircle2 className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <h3 className="text-lg font-bold text-foreground">لا يوجد موظفون بعد</h3>
            <p className="text-sm text-muted-foreground mt-1">أضف أول حساب من الأعلى</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    {user.role === "ADMIN" ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : (
                      <UserCircle2 className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      {user.name || "بدون اسم"}
                      {!user.isActive && (
                        <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                          معطّل
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5" dir="ltr">
                      {user.email}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {user.role === "ADMIN" ? "مدير" : "بائع"}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 sm:mr-auto">
                  <Button
                    onClick={() => toggleActive(user)}
                    disabled={busyId === user.id}
                    variant={user.isActive ? "destructive" : "default"}
                    size="sm"
                    className="gap-1"
                  >
                    {user.isActive ? (
                      <>
                        <Ban className="w-3.5 h-3.5" /> تعطيل
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> تفعيل
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
