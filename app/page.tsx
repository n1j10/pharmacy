import Link from "next/link";
import {
  getExpiringSoonBatches,
  getInventoryStats,
} from "@/lib/actions/medicine-actions";
import { getSalesSummary } from "@/lib/actions/sale-actions";
import { getSessionUser } from "@/lib/session";
import type { Prisma } from "../generated/prisma/client";
import Container from "@/components/global/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const [expiringResult, summaryResult, inventoryResult, user] = await Promise.all([
    getExpiringSoonBatches(30),
    getSalesSummary(),
    getInventoryStats(),
    getSessionUser(),
  ]);

  type ExpiringBatch = Prisma.BatchGetPayload<{
    include: { medicine: { include: { category: true } } };
  }>;

  const expiring: ExpiringBatch[] = expiringResult.success ? expiringResult.data : [];
  const summary = summaryResult.success
    ? summaryResult.data
    : { salesCount: 0, totalRevenue: 0 };
  const inventory = inventoryResult.success
    ? inventoryResult.data
    : { medicineCount: 0, outOfStock: 0, lowStock: 0 };
  const isAdmin = user?.role === "ADMIN";

  return (
    <Container className="py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            لوحة{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              التحكم
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">مرحباً بك — نظرة عامة على الصيدلية</p>
        </div>
        <Button asChild size="lg" className="gap-2 font-bold shadow-lg">
          <Link href="/sales/new">
            <span>➕</span>
            <span>بيع جديد</span>
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="relative overflow-hidden group hover:border-primary/50 transition-all shadow-md bg-white/5 border-white/10">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4 text-2xl">
              💰
            </div>
            <div className="text-sm font-bold text-muted-foreground mb-1">إجمالي الإيرادات</div>
            <div className="text-2xl font-black">{summary.totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">دينار عراقي</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:border-emerald-500/50 transition-all shadow-md bg-white/5 border-white/10">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 text-2xl">
              🧾
            </div>
            <div className="text-sm font-bold text-muted-foreground mb-1">عدد المبيعات</div>
            <div className="text-2xl font-black">{summary.salesCount}</div>
            <div className="text-xs text-muted-foreground mt-1">عملية بيع</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:border-amber-500/50 transition-all shadow-md bg-white/5 border-white/10">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 text-2xl">
              ⏳
            </div>
            <div className="text-sm font-bold text-muted-foreground mb-1">دفعات قريبة الانتهاء</div>
            <div className={cn("text-2xl font-black", expiring.length > 0 ? "text-amber-500" : "")}>
              {expiring.length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">خلال 30 يوم</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:border-indigo-500/50 transition-all shadow-md bg-white/5 border-white/10">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4 text-2xl">
              💊
            </div>
            <div className="text-sm font-bold text-muted-foreground mb-1">الأدوية بالمخزن</div>
            <div className="text-2xl font-black">{inventory.medicineCount}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {inventory.lowStock}  منخفض — {inventory.outOfStock} نفذ
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actionss */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/medicines" className="block group">
          <Card className="hover:border-primary/50 transition-all shadow-md bg-card/80 backdrop-blur border-white/10">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="text-4xl">💊</div>
              <div className="flex-1">
                <div className="font-bold text-lg">الأدوية</div>
                <div className="text-sm text-muted-foreground">إدارة المخزون</div>
              </div>
              <div className="text-primary text-xl font-bold group-hover:-translate-x-2 transition-transform">←</div>
            </CardContent>
          </Card>
        </Link>

        {isAdmin && (
          <Link href="/categories" className="block group">
            <Card className="hover:border-primary/50 transition-all shadow-md bg-card/80 backdrop-blur border-white/10">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="text-4xl">🗂️</div>
                <div className="flex-1">
                  <div className="font-bold text-lg">الفئات</div>
                  <div className="text-sm text-muted-foreground">تصنيف الأدوية</div>
                </div>
                <div className="text-primary text-xl font-bold group-hover:-translate-x-2 transition-transform">←</div>
              </CardContent>
            </Card>
          </Link>
        )}

        <Link href="/sales" className="block group">
          <Card className="hover:border-primary/50 transition-all shadow-md bg-card/80 backdrop-blur border-white/10">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="text-4xl">🧾</div>
              <div className="flex-1">
                <div className="font-bold text-lg">المبيعات</div>
                <div className="text-sm text-muted-foreground">سجل العمليات</div>
              </div>
              <div className="text-primary text-xl font-bold group-hover:-translate-x-2 transition-transform">←</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Expiring Batches */}
      <Card className="border-white/10 shadow-lg bg-card/95">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <CardTitle className="text-lg font-bold">دفعات قريبة من الانتهاء</CardTitle>
            <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10 ml-2 font-bold">
              خلال 30 يوم
            </Badge>
          </div>
          {expiring.length > 0 && (
            <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10 font-bold">
              {expiring.length} دفعة
            </Badge>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {expiring.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="text-6xl mb-4 opacity-70">✅</div>
              <h3 className="text-xl font-bold text-foreground">لا توجد دفعات منتهية الصلاحية</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                جميع الأدوية بعيدة عن تاريخ انتهاء الصلاحية
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-border/50">
                  <TableHead className="text-right font-bold py-4">الدواء</TableHead>
                  <TableHead className="text-right font-bold py-4">الفئة</TableHead>
                  <TableHead className="text-right font-bold py-4">الكمية</TableHead>
                  <TableHead className="text-right font-bold py-4">تاريخ الانتهاء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiring.map((batch) => (
                  <TableRow key={batch.id} className="border-border/50 hover:bg-white/5">
                    <TableCell className="py-4">
                      <Link
                        href={`/medicines/${batch.medicine.id}`}
                        className="font-bold text-primary hover:text-sky-300 hover:underline transition-colors"
                      >
                        {batch.medicine.name}
                      </Link>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="secondary" className="bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/20">
                        {batch.medicine.category.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="font-bold text-lg">{batch.quantity}</span>{" "}
                      <span className="text-xs text-muted-foreground font-medium">وحدة</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10 gap-1.5 font-bold">
                        <span>⏰</span>
                        {new Date(batch.expiryDate).toLocaleDateString("ar-IQ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
