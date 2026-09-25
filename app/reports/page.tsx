import Link from "next/link";
import {
  getReports,
  getTodayAndMonthSummary,
  getLowStockMedicines,
  getExpiringSoonBatches,
  getSettings,
} from "@/lib/queries";
import Container from "@/components/global/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  DollarSign,
  Receipt,
} from "lucide-react";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;

  const defaultFrom = new Date();
  defaultFrom.setDate(1);
  defaultFrom.setHours(0, 0, 0, 0);
  const defaultTo = new Date();
  defaultTo.setHours(23, 59, 59, 999);

  const fromDate = params.from ? new Date(`${params.from}T00:00:00`) : defaultFrom;
  const toDate = params.to ? new Date(`${params.to}T23:59:59`) : defaultTo;

  const [reportResult, summaryResult, lowStockResult, expiringResult, settingsResult] =
    await Promise.all([
      getReports({ fromDate, toDate }),
      getTodayAndMonthSummary(),
      getLowStockMedicines(),
      getExpiringSoonBatches(30),
      getSettings(),
    ]);

  const currency = settingsResult.success ? settingsResult.data.currency : "د.ع";

  if (!reportResult.success) {
    return (
      <Container className="py-8">
        <p className="text-red-400">{reportResult.error}</p>
      </Container>
    );
  }

  const report = reportResult.data;
  const summary = summaryResult.success ? summaryResult.data : null;
  const lowStock = lowStockResult.success ? lowStockResult.data : [];
  const expiring = expiringResult.success ? expiringResult.data : [];

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">التقارير</h1>
        <p className="text-muted-foreground mt-1">أداء المبيعات والربح والمخزون</p>
      </div>

      {/* date range filter */}
      <form className="mb-6 flex flex-wrap items-end gap-3" dir="rtl">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">من</label>
          <input
            type="date"
            name="from"
            defaultValue={toInputDate(fromDate)}
            className="flex h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">إلى</label>
          <input
            type="date"
            name="to"
            defaultValue={toInputDate(toDate)}
            className="flex h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
        <Button type="submit">تطبيق</Button>
      </form>

      {/* today/month quick summary */}
      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="border-white/10 bg-card/80">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">مبيعات اليوم</p>
                <p className="mt-1 text-2xl font-black">
                  {summary.todayRevenue.toLocaleString()} {currency}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{summary.todayCount} فاتورة</p>
              </div>
              <Receipt className="h-8 w-8 text-primary/60" />
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-card/80">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">مبيعات الشهر</p>
                <p className="mt-1 text-2xl font-black">
                  {summary.monthRevenue.toLocaleString()} {currency}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{summary.monthCount} فاتورة</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary/60" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* period report */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border-white/10 bg-card/80">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">عدد الفواتير</p>
            <p className="mt-1 text-xl font-black">{report.salesCount}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-card/80">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">صافي الإيرادات</p>
            <p className="mt-1 text-xl font-black">
              {report.netRevenue.toLocaleString()} {currency}
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-card/80">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">التكلفة</p>
            <p className="mt-1 text-xl font-black">
              {report.cost.toLocaleString()} {currency}
            </p>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4">
            <p className="text-xs text-emerald-400">إجمالي الربح</p>
            <p className="mt-1 text-xl font-black text-emerald-400">
              {report.profit.toLocaleString()} {currency}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* top medicines */}
        <Card className="border-white/10 bg-card/80">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              أكثر الأدوية مبيعاً
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {report.topMedicines.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد بيانات لهذي الفترة</p>
            ) : (
              <div className="divide-y divide-border/50">
                {report.topMedicines.map((m, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <span className="font-semibold">{m.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {m.quantity} وحدة — {m.revenue.toLocaleString()} {currency}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* low stock */}
        <Card className="border-white/10 bg-card/80">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-400" />
              مخزون منخفض
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا يوجد نقص حالياً</p>
            ) : (
              <div className="divide-y divide-border/50">
                {lowStock.slice(0, 10).map((m) => (
                  <Link
                    key={m.id}
                    href={`/medicines/${m.id}`}
                    className="flex items-center justify-between py-2 hover:text-primary"
                  >
                    <span className="font-semibold">{m.name}</span>
                    <span
                      className={`text-sm ${
                        m.totalQuantity === 0 ? "text-red-400" : "text-amber-400"
                      }`}
                    >
                      {m.totalQuantity} متبقي
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* expiring soon */}
        <Card className="border-white/10 bg-card/80 lg:col-span-2">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-400" />
              دفعات قريبة من الانتهاء (٣٠ يوم)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {expiring.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد دفعات قريبة من الانتهاء</p>
            ) : (
              <div className="divide-y divide-border/50">
                {expiring.map((batch) => (
                  <Link
                    key={batch.id}
                    href={`/medicines/${batch.medicineId}`}
                    className="flex items-center justify-between py-2 hover:text-primary"
                  >
                    <span className="flex items-center gap-2 font-semibold">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      {batch.medicine.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {batch.quantity} وحدة — ينتهي {new Date(batch.expiryDate).toLocaleDateString("ar-IQ")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
