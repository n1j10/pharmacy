"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSaleReturn } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ReturnableItem = {
  id: string;
  name: string;
  remaining: number;
};

export default function ReturnForm({
  saleId,
  items,
}: {
  saleId: string;
  items: ReturnableItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState<Record<string, string>>(
    Object.fromEntries(items.map((i) => [i.id, "0"]))
  );

  if (items.every((i) => i.remaining <= 0)) {
    return <p className="text-sm text-muted-foreground print:hidden">تم إرجاع كل الأصناف.</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = items
      .map((item) => ({ saleItemId: item.id, quantity: Number(qty[item.id] || 0) }))
      .filter((row) => row.quantity > 0);

    if (payload.length === 0) {
      setError("حدد كمية للإرجاع");
      return;
    }

    setLoading(true);
    const result = await createSaleReturn({ saleId, items: payload });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button type="button" variant="secondary" className="print:hidden" onClick={() => setOpen(true)}>
        إرجاع أصناف
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-lg border border-border p-4 print:hidden">
      {error && <p className="text-sm text-red-400">{error}</p>}
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-3">
          <Label className="flex-1">
            {item.name} (المتبقي {item.remaining})
          </Label>
          <Input
            type="number"
            min={0}
            max={item.remaining}
            value={qty[item.id]}
            onChange={(e) => setQty((prev) => ({ ...prev, [item.id]: e.target.value }))}
            className="w-24"
          />
        </div>
      ))}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "جاري الإرجاع..." : "تأكيد الإرجاع"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          إلغاء
        </Button>
      </div>
    </form>
  );
}
