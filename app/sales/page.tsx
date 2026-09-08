import Link from "next/link";
import { getSales } from "@/lib/actions/sale-actions";
import type { Prisma } from "../../generated/prisma/client";
import Container from "@/components/global/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, AlertCircle, Receipt, ArrowLeft } from "lucide-react";

export default async function SalesPage() {
  const result = await getSales();

  type SaleWithDetails = Prisma.SaleGetPayload<{
    include: { soldBy: true; items: { include: { medicine: true } } };
  }>;

  const sales: SaleWithDetails[] = result.success ? result.data : [];

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">سجل المبيعات</span>
          </h1>
          <p className="text-muted-foreground mt-1">{sales.length} عملية بيع مسجلة</p>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link href="/sales/new">
            <Plus className="w-5 h-5" />
            بيع جديد
          </Link>
        </Button>
      </div>

      {/* Error */}
      {!result.success && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      )}

      {/* Empty */}
      {result.success && sales.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Receipt className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold text-foreground">لا توجد مبيعات مسجلة بعد</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mb-6">
              ابدأ أول عملية بيع الآن
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link href="/sales/new">
                <Plus className="w-5 h-5" /> بيع جديد
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sales Table */}
      {result.success && sales.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">البائع</TableHead>
                  <TableHead className="text-right">عدد الأصناف</TableHead>
                  <TableHead className="text-right">المجموع</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <span className="text-muted-foreground font-medium">
                        {new Date(sale.createdAt).toLocaleString("ar-IQ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {(sale.soldBy.name || "م").charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">{sale.soldBy.name || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                        {sale.items.length} صنف
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-emerald-400 text-lg">
                        {sale.total.toString()}
                      </span>{" "}
                      <span className="text-xs text-muted-foreground">
                        د.ع
                      </span>
                    </TableCell>
                    <TableCell className="text-left">
                      <Button asChild variant="secondary" size="sm" className="gap-2">
                        <Link href={`/sales/${sale.id}`}>
                          التفاصيل
                          <ArrowLeft className="w-4 h-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
