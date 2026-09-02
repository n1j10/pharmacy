import Link from "next/link";
import { getSales } from "@/lib/actions/sale-actions";

export default async function SalesPage() {
  const result = await getSales();
  const sales = result.success ? result.data : [];

  return (
    <div className="page-container fade-in" dir="rtl">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span className="gradient-text">سجل المبيعات</span>
          </h1>
          <p className="page-subtitle">{sales.length} عملية بيع مسجلة</p>
        </div>
        <Link href="/sales/new" className="btn btn-primary btn-lg">
          <span>➕</span>
          <span>بيع جديد</span>
        </Link>
      </div>

      {/* Error */}
      {!result.success && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
          <span>❌</span>
          <span>{result.error}</span>
        </div>
      )}

      {/* Empty */}
      {result.success && sales.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🧾</div>
            <div className="empty-state-title">لا توجد مبيعات مسجلة بعد</div>
            <div className="empty-state-desc">
              ابدأ أول عملية بيع الآن
            </div>
            <Link
              href="/sales/new"
              className="btn btn-primary"
              style={{ marginTop: "0.5rem" }}
            >
              ➕ بيع جديد
            </Link>
          </div>
        </div>
      )}

      {/* Sales Table */}
      {result.success && sales.length > 0 && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>البائع</th>
                <th>عدد الأصناف</th>
                <th>المجموع</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td>
                    <span style={{ color: "#cbd5e1", fontWeight: 500 }}>
                      {new Date(sale.createdAt).toLocaleString("ar-IQ")}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "white",
                          flexShrink: 0,
                        }}
                      >
                        {(sale.soldBy.name || "م").charAt(0).toUpperCase()}
                      </div>
                      <span>{sale.soldBy.name || "—"}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-blue">
                      {sale.items.length} صنف
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontWeight: 700,
                        color: "#34d399",
                        fontSize: "0.95rem",
                      }}
                    >
                      {sale.total.toString()}
                    </span>{" "}
                    <span style={{ color: "#64748b", fontSize: "0.8rem" }}>
                      د.ع
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/sales/${sale.id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      التفاصيل →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
