"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBatch } from "@/lib/actions/medicine-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AddBatchForm({ medicineId }: { medicineId: string }) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!quantity || Number(quantity) <= 0) {
      setError("الكمية يجب تكون أكبر من صفر");
      return;
    }
    if (!expiryDate) {
      setError("تاريخ الانتهاء مطلوب");
      return;
    }

    setLoading(true);

    const result = await createBatch({
      medicineId,
      quantity: Number(quantity),
      expiryDate: new Date(expiryDate),
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setQuantity("");
    setExpiryDate("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)} className="gap-2">
        <Plus className="w-4 h-4" /> إضافة دفعة جديدة
      </Button>
    );
  }

  return (
    <Card className="max-w-md border-border/50 shadow-sm mt-4 bg-card/50">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="quantity">الكمية</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="مثال: 50"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="expiryDate">تاريخ الانتهاء</Label>
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "جاري الحفظ..." : "حفظ الدفعة"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} className="flex-1">
              إلغاء
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// turn into component