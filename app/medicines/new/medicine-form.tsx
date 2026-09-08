"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMedicine } from "@/lib/actions/medicine-actions";
import BarcodeDisplay from "./barcode-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Pill, PackagePlus } from "lucide-react";

type Category = {
  id: string;
  name: string;
};

export default function MedicineForm({ categories }: { categories: Category[] }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createdMedicine, setCreatedMedicine] = useState<{
    name: string;
    barcode: string;
  } | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    unit: "",
    manufacturer: "",
    categoryId: "",
    initialQuantity: "",
    expiryDate: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("اسم الدواء مطلوب");
      return;
    }
    if (!form.categoryId) {
      setError("اختر الفئة");
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      setError("السعر يجب يكون أكبر من صفر");
      return;
    }

    if (form.initialQuantity && !form.expiryDate) {
      setError("حدد تاريخ الانتهاء مع كمية الدفعة الأولى");
      return;
    }

    setLoading(true);

    const result = await createMedicine({
      name: form.name,
      description: form.description || undefined,
      price: Number(form.price),
      unit: form.unit || undefined,
      manufacturer: form.manufacturer || undefined,
      categoryId: form.categoryId,
      initialBatch:
        form.initialQuantity && form.expiryDate
          ? {
              quantity: Number(form.initialQuantity),
              expiryDate: new Date(form.expiryDate),
            }
          : undefined,
    });


    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setCreatedMedicine({
      name: result.data.name,
      barcode: result.data.barcode,
    });
  }

  if (createdMedicine) {
    return (
      <BarcodeDisplay
        medicineName={createdMedicine.name}
        barcode={createdMedicine.barcode}
        onDone={() => router.push("/medicines")}
        onAddAnother={() => {
          setCreatedMedicine(null);
          setForm({
            name: "",
            description: "",
            price: "",
            unit: "",
            manufacturer: "",
            categoryId: "",
            initialQuantity: "",
            expiryDate: "",
          });
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-white/10 shadow-sm bg-card/80">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary" />
            بيانات الدواء
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="after:content-['*'] after:ml-0.5 after:text-red-500">اسم الدواء</Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="مثال: بنادول اكسترا"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="after:content-['*'] after:ml-0.5 after:text-red-500">السعر (د.ع)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                value={form.price}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">الوحدة</Label>
              <Input
                id="unit"
                name="unit"
                value={form.unit}
                onChange={handleChange}
                placeholder="حبة / علبة / شريط"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manufacturer">الشركة المصنعة</Label>
            <Input
              id="manufacturer"
              name="manufacturer"
              value={form.manufacturer}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryId" className="after:content-['*'] after:ml-0.5 after:text-red-500">الفئة</Label>
            <select
              id="categoryId"
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">اختر الفئة</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 shadow-sm bg-card/80 overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-emerald-500" />
            الدفعة الأولى (اختياري)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initialQuantity">الكمية</Label>
              <Input
                id="initialQuantity"
                name="initialQuantity"
                type="number"
                value={form.initialQuantity}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">تاريخ الانتهاء</Label>
              <Input
                id="expiryDate"
                name="expiryDate"
                type="date"
                value={form.expiryDate}
                onChange={handleChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg flex items-center gap-2">
          <span>ℹ️</span> بعد الحفظ يتولد QR خاص بهذا الدواء تقدر تطبعه وتلصقه على العلبة.
        </p>

        <Button type="submit" disabled={loading} size="lg" className="w-full text-lg font-bold">
          {loading ? "جاري الحفظ..." : "حفظ الدواء وتوليد QR"}
        </Button>
      </div>
    </form>
  );
}
//turn into components