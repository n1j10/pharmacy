"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateMedicine } from "@/lib/actions/medicine-actions";

type Category = { id: string; name: string };

type Medicine = {
  id: string;
  name: string;
  description: string | null;
  price: { toString: () => string };
  unit: string | null;
  manufacturer: string | null;
  categoryId: string;
};

export default function EditMedicineForm({
  medicine,
  categories,
}: {
  medicine: Medicine;
  categories: Category[];
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: medicine.name,
    description: medicine.description || "",
    price: medicine.price.toString(),
    unit: medicine.unit || "",
    manufacturer: medicine.manufacturer || "",
    categoryId: medicine.categoryId,
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
    if (!form.price || Number(form.price) <= 0) {
      setError("السعر يجب يكون أكبر من صفر");
      return;
    }

    setLoading(true);

    const result = await updateMedicine(medicine.id, {
      name: form.name,
      description: form.description || undefined,
      price: Number(form.price),
      unit: form.unit || undefined,
      manufacturer: form.manufacturer || undefined,
      categoryId: form.categoryId,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push(`/medicines/${medicine.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="form-section" dir="rtl" style={{ maxWidth: 640 }}>
      <div className="form-section-header">تعديل بيانات الدواء</div>
      <div className="form-section-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {error && (
          <div className="alert alert-error">
            <span>❌</span>
            <span>{error}</span>
          </div>
        )}

        <div className="form-group">
          <label className="form-label required">اسم الدواء</label>
          <input name="name" value={form.name} onChange={handleChange} className="form-input" />
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
            <input name="unit" value={form.unit} onChange={handleChange} className="form-input" />
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
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary btn-lg btn-full">
          {loading ? "جاري الحفظ..." : "حفظ التعديلات"}
        </button>
      </div>
    </form>
  );
}
