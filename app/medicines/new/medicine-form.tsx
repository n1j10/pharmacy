"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMedicine } from "@/lib/actions/medicine-actions";
import BarcodeDisplay from "./barcode-display";

type Category = {
  id: string;
  name: string;
};

export default function MedicineForm({ categories }: { categories: Category[] }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createdMedicine, setCreatedMedicine] = useState<{
    name: string;
    barcode: string;
  } | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    unit: "",
    manufacturer: "",
    categoryId: "",
    initialQuantity: "",
    expiryDate: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("اسم الدواء مطلوب");
      return;
    }
    if (!form.categoryId) {
      setError("اختر الفئة");
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      setError("السعر يجب يكون أكبر من صفر");
      return;
    }

    if (form.initialQuantity && !form.expiryDate) {
      setError("حدد تاريخ الانتهاء مع كمية الدفعة الأولى");
      return;
    }

    setLoading(true);

    const result = await createMedicine({
      name: form.name,
      description: form.description || undefined,
      price: Number(form.price),
      unit: form.unit || undefined,
      manufacturer: form.manufacturer || undefined,
      categoryId: form.categoryId,
      initialBatch:
        form.initialQuantity && form.expiryDate
          ? {
              quantity: Number(form.initialQuantity),
              expiryDate: new Date(form.expiryDate),
            }
          : undefined,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setCreatedMedicine({
      name: result.data.name,
      barcode: result.data.barcode,
    });
  }

  if (createdMedicine) {
    return (
      <BarcodeDisplay
        medicineName={createdMedicine.name}
        barcode={createdMedicine.barcode}
        onDone={() => router.push("/medicines")}
        onAddAnother={() => {
          setCreatedMedicine(null);
          setForm({
            name: "",
            description: "",
            price: "",
            unit: "",
            manufacturer: "",
            categoryId: "",
            initialQuantity: "",
            expiryDate: "",
          });
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="form-section" dir="rtl" style={{ maxWidth: 640 }}>
      <div className="form-section-header">💊 بيانات الدواء</div>
      <div className="form-section-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {error && (
          <div className="alert alert-error">
            <span>❌</span>
            <span>{error}</span>
          </div>
        )}

        <div className="form-group">
          <label className="form-label required">اسم الدواء</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="form-input"
            placeholder="مثال: بنادول اكسترا"
          />
        </div>

        <div className="form-group">
          <label className="form-label">الوصف</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="form-textarea"
            rows={2}
          />
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label required">السعر (د.ع)</label>
            <input
              name="price"
              type="number"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">الوحدة</label>
            <input
              name="unit"
              value={form.unit}
              onChange={handleChange}
              placeholder="حبة / علبة / شريط"
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">الشركة المصنعة</label>
          <input
            name="manufacturer"
            value={form.manufacturer}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label required">الفئة</label>
          <select
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">اختر الفئة</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-section" style={{ boxShadow: "none" }}>
          <div className="form-section-header">📦 الدفعة الأولى (اختياري)</div>
          <div className="form-section-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">الكمية</label>
                <input
                  name="initialQuantity"
                  type="number"
                  value={form.initialQuantity}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">تاريخ الانتهاء</label>
                <input
                  name="expiryDate"
                  type="date"
                  value={form.expiryDate}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </div>

        <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
          بعد الحفظ يتولد QR خاص بهذا الدواء تقدر تطبعه وتلصقه على العلبة.
        </p>

        <button type="submit" disabled={loading} className="btn btn-primary btn-lg btn-full">
          {loading ? "جاري الحفظ..." : "حفظ الدواء وتوليد QR"}
        </button>
      </div>
    </form>
  );
}
