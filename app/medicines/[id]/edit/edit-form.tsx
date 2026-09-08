"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateMedicine } from "@/lib/actions/medicine-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Edit } from "lucide-react";

type Category = { id: string; name: string };

type Medicine = {
  id: string;
  name: string;
  description: string | null;
  price: { toString: () => string };
  unit: string | null;
  manufacturer: string | null;
  categoryId: string;
};

export default function EditMedicineForm({medicine,categories,}: {medicine: Medicine;categories: Category[];}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: medicine.name,
    description: medicine.description || "",
    price: medicine.price.toString(),
    unit: medicine.unit || "",
    manufacturer: medicine.manufacturer || "",
    categoryId: medicine.categoryId,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
    if (!form.price || Number(form.price) <= 0) {
      setError("السعر يجب يكون أكبر من صفر");
      return;
    }

    setLoading(true);

    const result = await updateMedicine(medicine.id, {
      name: form.name,
      description: form.description || undefined,
      price: Number(form.price),
      unit: form.unit || undefined,
      manufacturer: form.manufacturer || undefined,
      categoryId: form.categoryId,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push(`/medicines/${medicine.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-white/10 shadow-sm bg-card/80">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-primary" />
            تعديل بيانات الدواء
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
            <Label htmlFor="name" className="after:content-['*'] after:ml-0.5 after:text-red-500"
            >اسم الدواء</Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
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
              <Label htmlFor="price" className="after:content-['*'] after:ml-0.5 after:text-red-500"
              >السعر (د.ع)</Label>
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
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading} size="lg" className="w-full text-lg font-bold">
        {loading ? "جاري الحفظ..." : "حفظ التعديلات"}
      </Button>
    </form>
  );
}


// turn into component