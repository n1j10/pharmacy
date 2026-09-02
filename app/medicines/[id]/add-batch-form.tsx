"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBatch } from "@/lib/actions/medicine-actions";

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
      <button type="button" onClick={() => setOpen(true)} className="btn btn-primary btn-sm">
        + إضافة دفعة جديدة
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="form-section" dir="rtl" style={{ maxWidth: 420 }}>
      <div className="form-section-body" style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {error && (
          <div className="alert alert-error">
            <span>❌</span>
            <span>{error}</span>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">الكمية</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">تاريخ الانتهاء</label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="form-input"
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? "جاري الحفظ..." : "حفظ الدفعة"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary">
            إلغاء
          </button>
        </div>
      </div>
    </form>
  );
}
