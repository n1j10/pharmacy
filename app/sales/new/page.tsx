"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BarcodeScanner from "./barcode-scanner";
import Cart, { type CartItem } from "./cart";
import { getMedicineByBarcode } from "@/lib/actions/medicine-actions";
import { createSale } from "@/lib/actions/sale-actions";

export default function NewSalePage() {
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successHint, setSuccessHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [manualCode, setManualCode] = useState("");

  async function addByBarcode(rawBarcode: string) {
    const barcode = rawBarcode.trim();
    if (!barcode || busy) return;

    setBusy(true);
    setError(null);
    setSuccessHint(null);

    const existing = items.find((i) => i.barcode === barcode);
    if (existing) {
      if (existing.quantity >= existing.available) {
        setError(`ماكو كمية إضافية من "${existing.name}"`);
        setBusy(false);
        return;
      }

      handleQuantityChange(barcode, existing.quantity + 1);
      setSuccessHint(`تمت زيادة كمية ${existing.name}`);
      setBusy(false);
      return;
    }

    const result = await getMedicineByBarcode(barcode);

    if (!result.success) {
      setError(result.error);
      setBusy(false);
      return;
    }

    const medicine = result.data;

    if (medicine.totalQuantity === 0) {
      setError(`"${medicine.name}" ماكو مخزون صالح للبيع حالياً`);
      setBusy(false);
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        barcode: medicine.barcode,
        name: medicine.name,
        price: Number(medicine.price),
        quantity: 1,
        available: medicine.totalQuantity,
      },
    ]);
    setSuccessHint(`تمت إضافة ${medicine.name}`);
    setBusy(false);
  }

  function handleQuantityChange(barcode: string, quantity: number) {
    setItems((prev) =>
      prev.map((item) =>
        item.barcode === barcode
          ? {
              ...item,
              quantity: Math.max(1, Math.min(quantity, item.available)),
            }
          : item
      )
    );
  }

  function handleRemove(barcode: string) {
    setItems((prev) => prev.filter((item) => item.barcode !== barcode));
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    await addByBarcode(manualCode);
    setManualCode("");
  }

  async function handleConfirm() {
    if (items.length === 0) {
      setError("السلة فارغة");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await createSale({
      items: items.map((item) => ({
        barcode: item.barcode,
        quantity: item.quantity,
      })),
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push(`/sales/${result.data.id}`);
  }

  return (
    <div className="page-container fade-in" dir="rtl">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            بيع <span className="gradient-text">جديد</span>
          </h1>
          <p className="page-subtitle">
            امسح QR الدواء بالموبايل — ينضاف للسلة وينقص من المخزن بعد التأكيد
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
          <span>❌</span>
          <span>{error}</span>
        </div>
      )}

      {successHint && !error && (
        <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
          <span>✓</span>
          <span>{successHint}</span>
        </div>
      )}

      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📷 مسح الباركود</h2>
            {busy && <span className="badge badge-blue">جاري الإضافة...</span>}
          </div>
          <div className="card-body">
            <BarcodeScanner onScan={addByBarcode} enabled={!busy && !loading} />

            <form
              onSubmit={handleManualSubmit}
              style={{
                display: "flex",
                gap: "0.5rem",
                marginTop: "1.25rem",
              }}
            >
              <input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="أو اكتب الباركود يدوياً"
                className="form-input"
                dir="ltr"
                style={{ textAlign: "left" }}
              />
              <button type="submit" className="btn btn-primary" disabled={busy}>
                إضافة
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">🛒 السلة</h2>
            <span className="badge badge-blue">{items.length} صنف</span>
          </div>
          <div className="card-body">
            <Cart
              items={items}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemove}
            />

            <button
              onClick={handleConfirm}
              disabled={loading || items.length === 0}
              className="btn btn-success btn-lg btn-full"
              style={{ marginTop: "1.25rem" }}
            >
              {loading ? "جاري إتمام البيع..." : "إتمام البيع وخصم المخزون"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
