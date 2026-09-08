import Link from "next/link";
import { notFound } from "next/navigation";
import { getMedicineById } from "@/lib/actions/medicine-actions";
import { getSessionUser } from "@/lib/session";
import AddBatchForm from "./add-batch-form";
import DeleteMedicineButton from "./delete-medicine-button";
import DeleteBatchButton from "./delete-batch-button";
import type { Prisma } from "../../../generated/prisma/client";

import Container from "@/components/global/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Printer, Edit, QrCode, Calendar, Clock, AlertTriangle, AlertCircle, CheckCircle, Layers } from "lucide-react";

export default async function MedicineDetailPage({params,}: {params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [result, user] = await Promise.all([getMedicineById(id), getSessionUser()]);

  if (!result.success) {
    notFound();
  }

  const isAdmin = user?.role === "ADMIN";

  type MedicineDetail = Prisma.MedicineGetPayload<{
    include: {
      category: true;
      batches: true;
      saleItems: { include: { sale: { include: { soldBy: true } } } };
    };
  }> & { totalQuantity: number };

  const medicine = result.data as MedicineDetail;
  const today = new Date();

  return (
    <Container className="py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <Button asChild variant="link" className="p-0 h-auto mb-2 text-muted-foreground hover:text-primary">
            <Link href="/medicines" className="flex items-center gap-1">
              <ArrowRight className="w-4 h-4" /> الرجوع لقائمة الأدوية
            </Link>
          </Button>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {medicine.name}
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
              {medicine.category.name}
            </Badge>
          </p>
        </div>

        {isAdmin && (
          <div className="flex gap-2 flex-wrap">
            <Button asChild variant="outline" className="gap-2">
              <Link href={`/medicines/${medicine.id}/barcode`}>
                <QrCode className="w-4 h-4" />
                طباعة QR
              </Link>
            </Button>
            <Button asChild variant="secondary" className="gap-2">
              <Link href={`/medicines/${medicine.id}/edit`}>
                <Edit className="w-4 h-4" />
                تعديل
              </Link>
            </Button>
            <DeleteMedicineButton medicineId={medicine.id} />
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <InfoCard label="السعر" value={`${medicine.price.toString()} د.ع`} icon="💰" />

        <InfoCard
          label="الكمية القابلة للبيع"
          value={medicine.totalQuantity.toString()}
          icon="📦"
          highlight={
            medicine.totalQuantity === 0 ? "danger" : medicine.totalQuantity < 10
                ? "warning"
                : "success"
          }
        />
        <InfoCard label="الوحدة" value={medicine.unit || "—"} icon="⚖️" />
        <InfoCard label="الشركة المصنعة" value={medicine.manufacturer || "—"} icon="🏭" />
      </div>

      {/* Description */}
      {medicine.description && (
        <Card className="mb-8 border-white/10 shadow-sm bg-card/80">
          <CardContent className="p-6 text-muted-foreground leading-relaxed">
            {medicine.description}
          </CardContent>
        </Card>
      )}

      {/* Barcode Block */}
      <Card className="mb-8 border-white/10 shadow-sm overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-1 h-full bg-blue-500 opacity-50" />
        <CardHeader className="flex flex-row items-center justify-between pb-4 bg-muted/30">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-500" />
              الباركود الخاص بهذا الدواء
            </CardTitle>
            <p className="font-mono text-blue-400 mt-2 text-lg bg-blue-500/10 px-3 py-1 rounded inline-block">
              {medicine.barcode}
            </p>
          </div>
          {isAdmin && (
            <Button asChild variant="outline" size="sm" className="gap-2 shrink-0">
              <Link href={`/medicines/${medicine.id}/barcode`}>
                <Printer className="w-4 h-4" />
                طباعة الملصق
              </Link>
            </Button>
          )}
        </CardHeader>
      </Card>

      {/* Batches Table */}
      <Card className="mb-8 border-white/10 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            الدفعات
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {medicine.batches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              ماكو دفعات مسجلة لهذا الدواء
            </div>
          ) : (
            <div className="rounded-md border border-border/50 overflow-hidden mb-6">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-right">الكمية المتبقية</TableHead>
                    <TableHead className="text-right">تاريخ الانتهاء</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">تاريخ الاستلام</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    {isAdmin && <TableHead></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicine.batches.map((batch) => {
                    const expiryDate = new Date(batch.expiryDate);
                    const isExpired = expiryDate < today;
              const daysLeft = Math.ceil(
                      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    const isExpiringSoon = !isExpired && daysLeft <= 30;

                    return (
                      <TableRow key={batch.id}>
                        <TableCell className="font-bold">{batch.quantity}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            {expiryDate.toLocaleDateString("ar-IQ")}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell">
                          {new Date(batch.receivedAt).toLocaleDateString("ar-IQ")}
                        </TableCell>
                        <TableCell>
                          {isExpired ? (
                            <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 gap-1 border-red-500/20">
                              <AlertCircle className="w-3 h-3" /> منتهية
                            </Badge>
                          ) : isExpiringSoon ? (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 gap-1 border-amber-500/20">
                              <Clock className="w-3 h-3" /> تنتهي خلال {daysLeft} يوم
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 gap-1 border-emerald-500/20">
                              <CheckCircle className="w-3 h-3" /> سليمة
                            </Badge>
                          )}
                        </TableCell>

                        {isAdmin && (
                          <TableCell className="text-left">
                            <DeleteBatchButton batchId={batch.id} />
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {isAdmin && <AddBatchForm medicineId={medicine.id} />}
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card className="border-white/10 shadow-md">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <span className="text-xl">🧾</span>
            آخر المبيعات
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {medicine.saleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-4xl mb-3 opacity-50">🧾</span>
              <p className="text-muted-foreground">ماكو مبيعات مسجلة بعد لهذا الدواء</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">الكمية</TableHead>
                  <TableHead className="text-right">السعر وقت البيع</TableHead>
                  <TableHead className="text-right">البائع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicine.saleItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground py-4">
                      {new Date(item.sale.createdAt).toLocaleDateString("ar-IQ")}
                    </TableCell>
                    <TableCell className="font-bold text-blue-400 py-4">{item.quantity}</TableCell>
                    <TableCell className="py-4 font-medium">{item.priceAtSale.toString()} د.ع</TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                          {(item.sale.soldBy.name || "م").charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">{item.sale.soldBy.name || "—"}</span>
                      </div>
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





interface InfoCardProps {
  label: string;
  value: string;
  icon: string;
  highlight?: "success" | "warning" | "danger";
}
function InfoCard({label,value,icon,highlight,}: InfoCardProps) {
  const colorClass =highlight === "danger"? "text-red-500": highlight === "warning"
        ? "text-amber-500"
        : highlight === "success"
          ? "text-emerald-500"
          : "text-foreground";

  return (
    <Card className="bg-card/60 border-white/5 shadow-sm hover:bg-card/80 transition-colors">
      <CardContent className="p-5 flex items-start gap-4">
        <div className="text-2xl mt-1 opacity-80">{icon}</div>
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">{label}</div>
          <div className={`text-xl font-bold ${colorClass}`}>
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
// turn InfoCard into component