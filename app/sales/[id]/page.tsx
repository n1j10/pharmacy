import Link from "next/link";
import { notFound } from "next/navigation";
import { getSaleById, getSettings } from "@/lib/queries";
import { getSessionUser } from "@/lib/session";
import PrintButton from "@/components/ui/print-button";
import ReturnForm from "./return-form";
import Container from "@/components/global/Container";
import { Button } from "@/components/ui/button";

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, settingsResult, user] = await Promise.all([
    getSaleById(id),
    getSettings(),
    getSessionUser(),
  ]);

  if (!result.success) {
    notFound();
  }

  const sale = result.data;
  const settings = settingsResult.success ? settingsResult.data : null;
  const isAdmin = user?.role === "ADMIN";
  const currency = settings?.currency || "د.ع";
  const paymentLabel = sale.paymentMethod === "CARD" ? "بطاقة" : "نقد";

  const returnable = sale.items.map((item) => {
    const returned = item.returnItems.reduce((s, r) => s + r.quantity, 0);
    return {
      id: item.id,
      name: item.medicine.name,
      remaining: item.quantity - returned,
    };
  });

  return (
    <Container className="py-8">
      <div className="page-header print:hidden mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/sales" className="text-sm text-muted-foreground hover:text-primary">
            سجل المبيعات
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold">فاتورة {sale.invoiceNumber}</h1>
          <p className="text-muted-foreground mt-1">
            {new Date(sale.createdAt).toLocaleString("ar-IQ")} — البائع: {sale.soldBy.name || "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <PrintButton label="طباعة الإيصال" />
          <Button asChild variant="secondary">
            <Link href="/sales/new">بيع جديد</Link>
          </Button>
        </div>
      </div>

      <div className="receipt mx-auto max-w-xl rounded-xl border border-border bg-card p-6 print:max-w-none print:border-0 print:shadow-none">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-black">{settings?.pharmacyName || "الصيدلية"}</h2>
          {settings?.address && <p className="text-sm text-muted-foreground">{settings.address}</p>}
          {settings?.phone && <p className="text-sm text-muted-foreground">{settings.phone}</p>}
          <p className="mt-2 font-mono text-sm">{sale.invoiceNumber}</p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
          <div>التاريخ: {new Date(sale.createdAt).toLocaleString("ar-IQ")}</div>
          <div>الدفع: {paymentLabel}</div>
          <div>البائع: {sale.soldBy.name || "—"}</div>
          <div>الزبون: {sale.customer?.name || "نقدي"}</div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 text-right">الدواء</th>
              <th className="py-2 text-right">الكمية</th>
              <th className="py-2 text-right">السعر</th>
              <th className="py-2 text-right">المجموع</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.id} className="border-b border-border/50">
                <td className="py-2">{item.medicine.name}</td>
                <td className="py-2">{item.quantity}</td>
                <td className="py-2">
                  {Number(item.priceAtSale).toLocaleString()} {currency}
                </td>
                <td className="py-2">
                  {(Number(item.priceAtSale) * item.quantity).toLocaleString()} {currency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>المجموع</span>
            <span>
              {Number(sale.subtotal).toLocaleString()} {currency}
            </span>
          </div>
          <div className="flex justify-between">
            <span>الخصم</span>
            <span>
              {Number(sale.discount).toLocaleString()} {currency}
            </span>
          </div>
          <div className="flex justify-between text-lg font-black">
            <span>المستحق</span>
            <span>
              {Number(sale.total).toLocaleString()} {currency}
            </span>
          </div>
          {isAdmin && (
            <div className="flex justify-between text-emerald-400 print:hidden">
              <span>الربح التقريبي</span>
              <span>
                {sale.profit.toLocaleString()} {currency}
              </span>
            </div>
          )}
        </div>

        {sale.returns.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm print:hidden">
            <p className="font-bold text-amber-400">إرجاعات سابقة</p>
            {sale.returns.map((ret) => (
              <p key={ret.id} className="mt-1 text-muted-foreground">
                {new Date(ret.createdAt).toLocaleString("ar-IQ")} — {Number(ret.total).toLocaleString()} {currency}
              </p>
            ))}
          </div>
        )}

        {settings?.receiptFooter && (
          <p className="mt-6 text-center text-sm text-muted-foreground">{settings.receiptFooter}</p>
        )}
      </div>

      <div className="mx-auto mt-6 max-w-xl print:hidden">
        <ReturnForm saleId={sale.id} items={returnable} />
      </div>
    </Container>
  );
}
