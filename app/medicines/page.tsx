import Link from "next/link";
import { getMedicines } from "@/lib/actions/medicine-actions";
import { getCategories } from "@/lib/actions/medicine-actions";
import { getSessionUser } from "@/lib/session";

export default async function MedicinesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; categoryId?: string }>;
}) {
  const params = await searchParams;

  const [medicinesResult, categoriesResult, user] = await Promise.all([
    getMedicines({ search: params.search, categoryId: params.categoryId }),
    getCategories(),
    getSessionUser(),
  ]);

  const medicines = medicinesResult.success ? medicinesResult.data : [];
  const categories = categoriesResult.success ? categoriesResult.data : [];
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="page-container fade-in" dir="rtl">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span className="gradient-text">الأدوية</span>
          </h1>
          <p className="page-subtitle">
            {medicines.length} دواء مسجل في النظام
          </p>
        </div>
        {isAdmin && (
          <Link href="/medicines/new" className="btn btn-primary btn-lg">
            <span>➕</span>
            <span>إضافة دواء</span>
          </Link>
        )}
      </div>

      {/* Search & Filter */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-body" style={{ padding: "1rem 1.5rem" }}>
          <form
            className="flex gap-3"
            method="get"
            style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
          >
            <div className="search-bar" style={{ flex: 1 }}>
              <span className="search-icon">🔍</span>
              <input
                type="text"
                name="search"
                placeholder="بحث باسم الدواء أو الباركود..."
                defaultValue={params.search}
                className="form-input"
              />
            </div>

            <select
              name="categoryId"
              defaultValue={params.categoryId}
              className="form-select"
              style={{ width: "180px" }}
            >
              <option value="">كل الفئات</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <button type="submit" className="btn btn-primary">
              بحث
            </button>

            {(params.search || params.categoryId) && (
              <Link href="/medicines" className="btn btn-secondary">
                مسح
              </Link>
            )}
          </form>
        </div>
      </div>

      {/* Error */}
      {!medicinesResult.success && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
          <span>❌</span>
          <span>{medicinesResult.error}</span>
        </div>
      )}

      {/* Empty */}
      {medicinesResult.success && medicines.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">💊</div>
            <div className="empty-state-title">
              {params.search || params.categoryId
                ? "لا توجد نتائج للبحث"
                : "لا توجد أدوية مسجلة بعد"}
            </div>
            <div className="empty-state-desc">
              {params.search || params.categoryId
                ? "جرّب تغيير كلمة البحث أو الفئة"
                : "ابدأ بإضافة أول دواء في المخزون"}
            </div>
            {!params.search && !params.categoryId && isAdmin && (
              <Link
                href="/medicines/new"
                className="btn btn-primary"
                style={{ marginTop: "0.5rem" }}
              >
                ➕ إضافة دواء جديد
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Medicines Table */}
      {medicinesResult.success && medicines.length > 0 && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>اسم الدواء</th>
                <th>الفئة</th>
                <th>السعر</th>
                <th>المخزون</th>
                <th>الباركود</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((medicine) => {
                const isLowStock = medicine.totalQuantity < 10;
                const isOutOfStock = medicine.totalQuantity === 0;

                return (
                  <tr key={medicine.id}>
                    <td>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "#f1f5f9",
                        }}
                      >
                        {medicine.name}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-blue">
                        {medicine.category.name}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {medicine.price.toString()}
                      </span>{" "}
                      <span style={{ color: "#64748b", fontSize: "0.8rem" }}>
                        د.ع
                      </span>
                    </td>
                    <td>
                      {isOutOfStock ? (
                        <span className="badge badge-red">⛔ نفذ المخزون</span>
                      ) : isLowStock ? (
                        <span className="badge badge-orange">
                          ⚠️ {medicine.totalQuantity} — منخفض
                        </span>
                      ) : (
                        <span className="badge badge-green">
                          ✓ {medicine.totalQuantity}
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.8rem",
                          color: "#64748b",
                          background: "rgba(255,255,255,0.05)",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                        }}
                      >
                        {medicine.barcode || "—"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                        {isAdmin && (
                          <Link
                            href={`/medicines/${medicine.id}/barcode`}
                            className="btn btn-secondary btn-sm"
                          >
                            QR
                          </Link>
                        )}
                        <Link
                          href={`/medicines/${medicine.id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          التفاصيل
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
