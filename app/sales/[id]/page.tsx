import Link from "next/link";
import { notFound } from "next/navigation";
import { getSaleById } from "@/lib/actions/sale-actions";
import PrintButton from "@/components/ui/print-button";
import type { Prisma } from "@prisma/client";

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await getSaleById(id);

  if (!result.success) {
    notFound();
  }

  type SaleWithDetails = Prisma.SaleGetPayload<{
    include: { soldBy: true; items: { include: { medicine: true } } };
  }>;

  const sale = result.data as SaleWithDetails;

  return (
    <div className="page-container fade-in" dir="rtl">
      <div className="page-header print-hidden">
        <div>
          <Link href="/sales" className="link-primary" style={{ fontSize: "0.85rem" }}>
            ← سجل المبيعات
          </Link>
          <h1 className="page-title" style={{ marginTop: "0.5rem" }}>
            فاتورة بيع
          </h1>
          <p className="page-subtitle">
            {new Date(sale.createdAt).toLocaleString("ar-IQ")} — البائع:{" "}
            {sale.soldBy.name || "—"}
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <div className="card-header">
          <h2 className="card-title">تفاصيل الفاتورة</h2>
          <span className="badge badge-green">{sale.total.toString()} د.ع</span>
        </div>
        <div className="table-container" style={{ border: "none" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>الدواء</th>
                <th>الكمية</th>
                <th>السعر</th>
                <th>المجموع</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link href={`/medicines/${item.medicine.id}`} className="link-primary">
                      {item.medicine.name}
                    </Link>
                  </td>
                  <td>{item.quantity}</td>
                  <td>{item.priceAtSale.toString()} د.ع</td>
                  <td>
                    {(Number(item.priceAtSale) * item.quantity).toLocaleString()} د.ع
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          className="card-body"
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 800,
            fontSize: "1.15rem",
            borderTop: "1px solid var(--dark-border)",
          }}
        >
          <span>المجموع الكلي</span>
          <span style={{ color: "#34d399" }}>{sale.total.toString()} د.ع</span>
        </div>
      </div>
    </div>
  );
}
