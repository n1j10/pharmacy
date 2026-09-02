import Link from "next/link";
import { notFound } from "next/navigation";
import { getMedicineById } from "@/lib/actions/medicine-actions";
import { getSessionUser } from "@/lib/session";
import AddBatchForm from "./add-batch-form";
import DeleteMedicineButton from "./delete-medicine-button";
import DeleteBatchButton from "./delete-batch-button";

export default async function MedicineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [result, user] = await Promise.all([getMedicineById(id), getSessionUser()]);

  if (!result.success) {
    notFound();
  }

  const isAdmin = user?.role === "ADMIN";
  const medicine = result.data;
  const today = new Date();

  return (
    <div className="page-container fade-in" dir="rtl">
      <div className="page-header">
        <div>
          <Link href="/medicines" className="link-primary" style={{ fontSize: "0.85rem" }}>
            ← الرجوع لقائمة الأدوية
          </Link>
          <h1 className="page-title" style={{ marginTop: "0.5rem" }}>
            {medicine.name}
          </h1>
          <p className="page-subtitle">{medicine.category.name}</p>
        </div>

        {isAdmin && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Link href={`/medicines/${medicine.id}/barcode`} className="btn btn-primary">
              طباعة QR
            </Link>
            <Link href={`/medicines/${medicine.id}/edit`} className="btn btn-secondary">
              تعديل
            </Link>
            <DeleteMedicineButton medicineId={medicine.id} />
          </div>
        )}
      </div>

      <div className="grid-4" style={{ marginBottom: "1.5rem" }}>
        <InfoCard label="السعر" value={`${medicine.price.toString()} د.ع`} />
        <InfoCard
          label="الكمية القابلة للبيع"
          value={medicine.totalQuantity.toString()}
          highlight={
            medicine.totalQuantity === 0
              ? "danger"
              : medicine.totalQuantity < 10
                ? "warning"
                : "success"
          }
        />
        <InfoCard label="الوحدة" value={medicine.unit || "—"} />
        <InfoCard label="الشركة المصنعة" value={medicine.manufacturer || "—"} />
      </div>

      {medicine.description && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div className="card-body" style={{ color: "#94a3b8" }}>
            {medicine.description}
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-header">
          <div>
            <p className="card-title">الباركود الخاص بهذا الدواء</p>
            <p style={{ fontFamily: "monospace", color: "#38bdf8", marginTop: "0.25rem" }}>
              {medicine.barcode}
            </p>
          </div>
          {isAdmin && (
            <Link href={`/medicines/${medicine.id}/barcode`} className="btn btn-secondary btn-sm">
              طباعة الملصق
            </Link>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-header">
          <h2 className="card-title">الدفعات</h2>
        </div>
        <div className="card-body">
          {medicine.batches.length === 0 && (
            <p style={{ color: "#64748b", marginBottom: "1rem" }}>ماكو دفعات مسجلة لهذا الدواء</p>
          )}

          {medicine.batches.length > 0 && (
            <div className="table-container" style={{ marginBottom: "1rem" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>الكمية المتبقية</th>
                    <th>تاريخ الانتهاء</th>
                    <th>تاريخ الاستلام</th>
                    <th>الحالة</th>
                    {isAdmin && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {medicine.batches.map((batch) => {
                    const expiryDate = new Date(batch.expiryDate);
                    const isExpired = expiryDate < today;
                    const daysLeft = Math.ceil(
                      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const isExpiringSoon = !isExpired && daysLeft <= 30;

                    return (
                      <tr key={batch.id}>
                        <td>{batch.quantity}</td>
                        <td>{expiryDate.toLocaleDateString("ar-IQ")}</td>
                        <td style={{ color: "#64748b" }}>
                          {new Date(batch.receivedAt).toLocaleDateString("ar-IQ")}
                        </td>
                        <td>
                          {isExpired && <span className="badge badge-red">منتهية</span>}
                          {isExpiringSoon && (
                            <span className="badge badge-orange">تنتهي خلال {daysLeft} يوم</span>
                          )}
                          {!isExpired && !isExpiringSoon && (
                            <span className="badge badge-green">سليمة</span>
                          )}
                        </td>
                        {isAdmin && (
                          <td>
                            <DeleteBatchButton batchId={batch.id} />
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {isAdmin && <AddBatchForm medicineId={medicine.id} />}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">آخر المبيعات</h2>
        </div>
        {medicine.saleItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">ماكو مبيعات مسجلة بعد لهذا الدواء</div>
          </div>
        ) : (
          <div className="table-container" style={{ border: "none" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>الكمية</th>
                  <th>السعر وقت البيع</th>
                  <th>البائع</th>
                </tr>
              </thead>
              <tbody>
                {medicine.saleItems.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.sale.createdAt).toLocaleDateString("ar-IQ")}</td>
                    <td>{item.quantity}</td>
                    <td>{item.priceAtSale.toString()} د.ع</td>
                    <td>{item.sale.soldBy.name || "—"}</td>
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

function InfoCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "success" | "warning" | "danger";
}) {
  const color =
    highlight === "danger"
      ? "#f87171"
      : highlight === "warning"
        ? "#fbbf24"
        : highlight === "success"
          ? "#34d399"
          : "#f1f5f9";

  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ fontSize: "1.25rem", color }}>
        {value}
      </div>
    </div>
  );
}
