import Link from "next/link";
import {
  getExpiringSoonBatches,
  getInventoryStats,
} from "@/lib/actions/medicine-actions";
import { getSalesSummary } from "@/lib/actions/sale-actions";
import { getSessionUser } from "@/lib/session";

export default async function DashboardPage() {
  const [expiringResult, summaryResult, inventoryResult, user] = await Promise.all([
    getExpiringSoonBatches(30),
    getSalesSummary(),
    getInventoryStats(),
    getSessionUser(),
  ]);

  const expiring = expiringResult.success ? expiringResult.data : [];
  const summary = summaryResult.success
    ? summaryResult.data
    : { salesCount: 0, totalRevenue: 0 };
  const inventory = inventoryResult.success
    ? inventoryResult.data
    : { medicineCount: 0, outOfStock: 0, lowStock: 0 };
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="page-container fade-in" dir="rtl">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            لوحة{" "}
            <span className="gradient-text">التحكم</span>
          </h1>
          <p className="page-subtitle">مرحباً بك — نظرة عامة على الصيدلية</p>
        </div>
        <Link href="/sales/new" className="btn btn-primary btn-lg">
          <span>➕</span>
          <span>بيع جديد</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid-4" style={{ marginBottom: "2rem" }}>
        <div className="stat-card">
          <div className="stat-icon blue">💰</div>
          <div className="stat-label">إجمالي الإيرادات</div>
          <div className="stat-value" style={{ fontSize: "1.4rem" }}>
            {summary.totalRevenue.toLocaleString()}
          </div>
          <div className="stat-sub">دينار عراقي</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">🧾</div>
          <div className="stat-label">عدد المبيعات</div>
          <div className="stat-value">{summary.salesCount}</div>
          <div className="stat-sub">عملية بيع</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">⏳</div>
          <div className="stat-label">دفعات قريبة الانتهاء</div>
          <div
            className="stat-value"
            style={{ color: expiring.length > 0 ? "#fbbf24" : "#f1f5f9" }}
          >
            {expiring.length}
          </div>
          <div className="stat-sub">خلال 30 يوم</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">💊</div>
          <div className="stat-label">الأدوية بالمخزن</div>
          <div className="stat-value">{inventory.medicineCount}</div>
          <div className="stat-sub">
            {inventory.lowStock} منخفض — {inventory.outOfStock} نفذ
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid-3" style={{ marginBottom: "2rem" }}>
        <Link href="/medicines" className="card" style={{ textDecoration: "none", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ fontSize: "2rem" }}>💊</div>
          <div>
            <div style={{ fontWeight: 700, color: "#f1f5f9" }}>الأدوية</div>
            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>إدارة المخزون</div>
          </div>
          <span style={{ marginRight: "auto", color: "#38bdf8", fontSize: "1.2rem" }}>←</span>
        </Link>

        {isAdmin && (
        <Link href="/categories" className="card" style={{ textDecoration: "none", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ fontSize: "2rem" }}>🗂️</div>
          <div>
            <div style={{ fontWeight: 700, color: "#f1f5f9" }}>الفئات</div>
            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>تصنيف الأدوية</div>
          </div>
          <span style={{ marginRight: "auto", color: "#38bdf8", fontSize: "1.2rem" }}>←</span>
        </Link>
        )}

        <Link href="/sales" className="card" style={{ textDecoration: "none", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ fontSize: "2rem" }}>🧾</div>
          <div>
            <div style={{ fontWeight: 700, color: "#f1f5f9" }}>المبيعات</div>
            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>سجل العمليات</div>
          </div>
          <span style={{ marginRight: "auto", color: "#38bdf8", fontSize: "1.2rem" }}>←</span>
        </Link>
      </div>

      {/* Expiring Batches */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>⚠️</span>
            <h2 className="card-title">دفعات قريبة من الانتهاء</h2>
            <span className="badge badge-orange" style={{ marginRight: "0.5rem" }}>
              خلال 30 يوم
            </span>
          </div>
          {expiring.length > 0 && (
            <span className="badge badge-orange">{expiring.length} دفعة</span>
          )}
        </div>

        {expiring.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <div className="empty-state-title">لا توجد دفعات منتهية الصلاحية</div>
            <div className="empty-state-desc">
              جميع الأدوية بعيدة عن تاريخ انتهاء الصلاحية
            </div>
          </div>
        ) : (
          <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>الدواء</th>
                  <th>الفئة</th>
                  <th>الكمية</th>
                  <th>تاريخ الانتهاء</th>
                </tr>
              </thead>
              <tbody>
                {expiring.map((batch) => (
                  <tr key={batch.id}>
                    <td>
                      <Link
                        href={`/medicines/${batch.medicine.id}`}
                        className="link-primary"
                        style={{ fontWeight: 600 }}
                      >
                        {batch.medicine.name}
                      </Link>
                    </td>
                    <td>
                      <span className="badge badge-blue">
                        {batch.medicine.category.name}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{batch.quantity}</span>{" "}
                      <span style={{ color: "#64748b", fontSize: "0.8rem" }}>وحدة</span>
                    </td>
                    <td>
                      <span className="badge badge-orange">
                        ⏰{" "}
                        {new Date(batch.expiryDate).toLocaleDateString("ar-IQ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
