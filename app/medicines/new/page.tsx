import Link from "next/link";
import { getCategories } from "@/lib/actions/medicine-actions";
import MedicineForm from "./medicine-form";

export default async function NewMedicinePage() {
  const categoriesResult = await getCategories();
  const categories = categoriesResult.success ? categoriesResult.data : [];

  return (
    <div className="page-container fade-in" dir="rtl">
      <div className="page-header">
        <div>
          <Link href="/medicines" className="link-primary" style={{ fontSize: "0.85rem" }}>
            ← الرجوع
          </Link>
          <h1 className="page-title" style={{ marginTop: "0.5rem" }}>
            إضافة <span className="gradient-text">دواء جديد</span>
          </h1>
          <p className="page-subtitle">
            احفظ الدواء ثم اطبع QR الخاص به للصقه على العلبة
          </p>
        </div>
      </div>

      {categories.length === 0 && (
        <div className="alert alert-warning" style={{ marginBottom: "1rem", maxWidth: 640 }}>
          <span>⚠️</span>
          <span>
            ماكو فئات بعد.{" "}
            <Link href="/categories" className="link-primary">
              أضف فئة أولاً
            </Link>{" "}
            قبل إضافة دواء.
          </span>
        </div>
      )}

      <MedicineForm categories={categories} />
    </div>
  );
}
