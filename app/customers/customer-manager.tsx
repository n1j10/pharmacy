"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCustomer, updateCustomer, deleteCustomer } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus, Users, Edit2, Trash2, Check, X } from "lucide-react";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
};

export default function CustomerManager({ customers }: { customers: Customer[] }) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingPhone, setEditingPhone] = useState("");
  const [editingNotes, setEditingNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("اسم الزبون مطلوب");
      return;
    }

    setLoading(true);
    const result = await createCustomer({ name, phone, notes });
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setName("");
    setPhone("");
    setNotes("");
    router.refresh();
  }

  function startEdit(customer: Customer) {
    setEditingId(customer.id);
    setEditingName(customer.name);
    setEditingPhone(customer.phone || "");
    setEditingNotes(customer.notes || "");
  }

  async function handleUpdate(id: string) {
    setError(null);
    if (!editingName.trim()) {
      setError("اسم الزبون مطلوب");
      return;
    }
    const result = await updateCustomer(id, {
      name: editingName,
      phone: editingPhone,
      notes: editingNotes,
    });
    if (!result.success) {
      setError(result.error);
      return;
    }
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("متأكد تريد تحذف هذا الزبون؟");
    if (!confirmed) return;

    const result = await deleteCustomer(id);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Add form */}
      <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="c-name">الاسم</Label>
          <Input
            id="c-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم الزبون"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="c-phone">الهاتف (اختياري)</Label>
          <Input
            id="c-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07xxxxxxxxx"
            dir="ltr"
            className="mt-1 text-left"
          />
        </div>
        <div>
          <Label htmlFor="c-notes">ملاحظات (اختياري)</Label>
          <Input
            id="c-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظة..."
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-3">
          <Button type="submit" disabled={loading} className="gap-2">
            <Plus className="w-4 h-4" />
            {loading ? "جاري الإضافة..." : "إضافة زبون"}
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
        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <h3 className="text-lg font-bold text-foreground">لا يوجد زبائن بعد</h3>
            <p className="text-sm text-muted-foreground mt-1">أضف أول زبون من الأعلى</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
              >
                {editingId === customer.id ? (
                  <div className="grid flex-1 gap-2 sm:grid-cols-3">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
                    />
                    <Input
                      value={editingPhone}
                      onChange={(e) => setEditingPhone(e.target.value)}
                      dir="ltr"
                      className="text-left"
                    />
                    <Input
                      value={editingNotes}
                      onChange={(e) => setEditingNotes(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{customer.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5" dir="ltr">
                        {customer.phone || "—"}
                      </div>
                      {customer.notes && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {customer.notes}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 shrink-0 sm:mr-auto">
                  {editingId === customer.id ? (
                    <>
                      <Button
                        onClick={() => handleUpdate(customer.id)}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                      >
                        <Check className="w-4 h-4" /> حفظ
                      </Button>
                      <Button
                        onClick={() => setEditingId(null)}
                        variant="secondary"
                        size="sm"
                        className="gap-1"
                      >
                        <X className="w-4 h-4" /> إلغاء
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => startEdit(customer)}
                        variant="secondary"
                        size="sm"
                        className="gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> تعديل
                      </Button>
                      <Button
                        onClick={() => handleDelete(customer.id)}
                        variant="destructive"
                        size="sm"
                        className="gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> حذف
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
