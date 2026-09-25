"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BarcodeScanner from "./barcode-scanner";
import Cart, { type CartItem } from "./cart";
import { getMedicineByBarcode, getMedicines, getCustomers } from "@/lib/queries";
import { createSale } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Customer = { id: string; name: string; phone: string | null };

type SearchHit = {
  barcode: string;
  name: string;
  price: number;
  available: number;
};

export default function NewSalePage() {
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successHint, setSuccessHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [search, setSearch] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [discount, setDiscount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD">("CASH");

  useEffect(() => {
    getCustomers().then((result) => {
      if (result.success) setCustomers(result.data);
    });
  }, []);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    const timer = setTimeout(async () => {
      const result = await getMedicines({ search: q });
      if (!result.success) return;
      setHits(
        result.data.slice(0, 8).map((m) => ({
          barcode: m.barcode,
          name: m.name,
          price: Number(m.price),
          available: m.totalQuantity,
        }))
      );
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

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

  function addHit(hit: SearchHit) {
    if (hit.available === 0) {
      setError(`"${hit.name}" ماكو مخزون صالح للبيع حالياً`);
      return;
    }
    addByBarcode(hit.barcode);
    setSearch("");
    setHits([]);
  }

  function handleQuantityChange(barcode: string, quantity: number) {
    setItems((prev) =>
      prev.map((item) =>
        item.barcode === barcode
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.available)) }
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

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountValue = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  const total = subtotal - discountValue;

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
      discount: discountValue,
      paymentMethod,
      customerId: customerId || null,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push(`/sales/${result.data.id}`);
  }

  return (
    <div className="page-container fade-in px-4 py-8 md:px-8" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">بيع جديد</h1>
        <p className="text-muted-foreground mt-1">
          ابحث بالاسم أو امسح الباركود ثم أكّد الفاتورة
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
          {error}
        </div>
      )}
      {successHint && !error && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-300">
          {successHint}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-bold">البحث والمسح</h2>

          <Label htmlFor="search">بحث باسم الدواء</Label>
          <Input
            id="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="اكتب اسم الدواء..."
            className="mt-1 mb-2"
          />
          {hits.length > 0 && (
            <div className="mb-4 divide-y divide-border overflow-hidden rounded-lg border border-border">
              {hits.map((hit) => (
                <button
                  key={hit.barcode}
                  type="button"
                  onClick={() => addHit(hit)}
                  className="flex w-full items-center justify-between px-3 py-2 text-right hover:bg-white/5"
                >
                  <span className="font-semibold">{hit.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {hit.price.toLocaleString()} د.ع — المتوفر {hit.available}
                  </span>
                </button>
              ))}
            </div>
          )}

          <BarcodeScanner onScan={addByBarcode} enabled={!busy && !loading} />

          <form onSubmit={handleManualSubmit} className="mt-4 flex gap-2">
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="أو اكتب الباركود يدوياً"
              dir="ltr"
              className="text-left"
            />
            <Button type="submit" disabled={busy}>
              إضافة
            </Button>
          </form>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">السلة</h2>
            <span className="text-sm text-muted-foreground">{items.length} صنف</span>
          </div>

          <Cart items={items} onQuantityChange={handleQuantityChange} onRemove={handleRemove} />

          <div className="mt-4 grid gap-3">
            <div>
              <Label htmlFor="customer">الزبون (اختياري)</Label>
              <select
                id="customer"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">بدون زبون</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.phone ? ` — ${c.phone}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="discount">خصم (د.ع)</Label>
                <Input
                  id="discount"
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pay">طريقة الدفع</Label>
                <select
                  id="pay"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as "CASH" | "CARD")}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="CASH">نقد</option>
                  <option value="CARD">بطاقة</option>
                </select>
              </div>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>المجموع قبل الخصم</span>
              <span>{subtotal.toLocaleString()} د.ع</span>
            </div>
            <div className="flex justify-between font-extrabold">
              <span>المستحق</span>
              <span className="text-emerald-400">{total.toLocaleString()} د.ع</span>
            </div>
            <Button
              onClick={handleConfirm}
              disabled={loading || items.length === 0}
              size="lg"
              className="w-full font-bold"
            >
              {loading ? "جاري إتمام البيع..." : "إتمام البيع وخصم المخزون"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
