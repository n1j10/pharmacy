import { getCategories } from "@/lib/actions/medicine-actions";
import CategoryManager from "./category-manager";

export default async function CategoriesPage() {
  const result = await getCategories();
  const categories = result.success ? result.data : [];

  return (
    <div className="page-container fade-in" dir="rtl">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span className="gradient-text">الفئات</span>
          </h1>
          <p className="page-subtitle">
            {categories.length} فئة مسجلة في النظام
          </p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <div className="card-header">
          <h2 className="card-title">🗂️ إدارة الفئات</h2>
        </div>
        <div className="card-body">
          <CategoryManager initialCategories={categories} />
        </div>
      </div>
    </div>
  );
}
