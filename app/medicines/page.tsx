import Link from "next/link";
import { getMedicines } from "@/lib/actions/medicine-actions";
import { getCategories } from "@/lib/actions/medicine-actions";
import { getSessionUser } from "@/lib/session";
import type { Prisma } from "../../generated/prisma/client";
import Container from "@/components/global/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Search, Pill, AlertCircle, QrCode, Info, PackageX, AlertTriangle, CheckCircle } from "lucide-react";

export default async function MedicinesPage({searchParams,}: {searchParams: Promise<{ search?: string; categoryId?: string }>;
}) {
  const params = await searchParams;

  const [medicinesResult, categoriesResult, user] = await Promise.all([
    getMedicines({ search: params.search, categoryId: params.categoryId }),
    getCategories(),
    getSessionUser(),
  ]);

  type MedicineWithStock = Prisma.MedicineGetPayload<{ include: { category: true; batches: true };}> & { totalQuantity: number };

  const medicines: MedicineWithStock[] = medicinesResult.success ? medicinesResult.data : [];

  const categories: { id: string; name: string }[] = categoriesResult.success ? categoriesResult.data : [];
  const isAdmin = user?.role === "ADMIN";

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">الأدوية</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {medicines.length} دواء مسجل في النظام
          </p>
        </div>
        {isAdmin && (
          <Button asChild size="lg" className="gap-2">
            <Link href="/medicines/new">
              <Plus className="w-5 h-5" />
              <span>إضافة دواء</span>
            </Link>
          </Button>
        )}
      </div>

      {/* Search & Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <form
            className="flex flex-col sm:flex-row gap-3 items-center"
            method="get"
          >
            <div className="relative flex-1 w-full">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                name="search"
                placeholder="بحث باسم الدواء أو الباركود..."
                defaultValue={params.search}
                className="pr-9"
              />
            </div>

            <select
              name="categoryId"
              defaultValue={params.categoryId}
              className="flex h-10 w-full sm:w-[180px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">كل الفئات</option>
              {categories.map((cat: { id: string; name: string }) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <Button type="submit" className="w-full sm:w-auto">
              بحث
            </Button>

            {(params.search || params.categoryId) && (
              <Button asChild variant="secondary" className="w-full sm:w-auto">
                <Link href="/medicines">
                  مسح
                </Link>
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Error */}
      {!medicinesResult.success && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{medicinesResult.error}</AlertDescription>
        </Alert>
      )}

      {/* Empty */}
      {medicinesResult.success && medicines.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Pill className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold text-foreground">
              {params.search || params.categoryId
                ? "لا توجد نتائج للبحث"
                : "لا توجد أدوية مسجلة بعد"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {params.search || params.categoryId
                ? "جرّب تغيير كلمة البحث أو الفئة"
                : "ابدأ بإضافة أول دواء في المخزون"}
            </p>
            {!params.search && !params.categoryId && isAdmin && (
              <Button asChild className="mt-4 gap-2">
                <Link href="/medicines/new">
                  <Plus className="w-4 h-4" /> إضافة دواء جديد
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Medicines Table */}
      {medicinesResult.success && medicines.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم الدواء</TableHead>
                  <TableHead className="text-right">الفئة</TableHead>
                  <TableHead className="text-right">السعر</TableHead>
                  <TableHead className="text-right">المخزون</TableHead>
                  <TableHead className="text-right">الباركود</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicines.map((medicine) => {
                  const isLowStock = medicine.totalQuantity < 10;
                  const isOutOfStock = medicine.totalQuantity === 0;
                  return (
                    <TableRow key={medicine.id}>
                      <TableCell>
                        <span className="font-semibold text-foreground">
                          {medicine.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                          {medicine.category.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{medicine.price.toString()}</span>{" "}
                        <span className="text-xs text-muted-foreground">د.ع</span>
                      </TableCell>


                      <TableCell>
                        {isOutOfStock ? (
                          <Badge variant="destructive" className="gap-1 bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20">
                            <PackageX className="w-3 h-3" /> نفذ المخزون
                          </Badge>
                        ) : isLowStock ? (
                          <Badge variant="outline" className="gap-1 bg-amber-500/10 text-amber-500 border-amber-500/20">
                            <AlertTriangle className="w-3 h-3" /> {medicine.totalQuantity} — منخفض
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                            <CheckCircle className="w-3 h-3" /> {medicine.totalQuantity}
                          </Badge>
                        )}
                      </TableCell>


                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground bg-foreground/5 px-2 py-1 rounded">
                          {medicine.barcode || "—"}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          {isAdmin && (
                            <Button asChild variant="secondary" size="sm" className="gap-1 h-8">
                              <Link href={`/medicines/${medicine.id}/barcode`}>
                                <QrCode className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">QR</span>
                              </Link>
                            </Button>
                          )}
                          <Button asChild variant="secondary" size="sm" className="gap-1 h-8">
                            <Link href={`/medicines/${medicine.id}`}>
                              <Info className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">التفاصيل</span>
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
