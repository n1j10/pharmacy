import Link from "next/link";
import { getCategories } from "@/lib/actions/medicine-actions";
import MedicineForm from "./medicine-form";
import Container from "@/components/global/Container";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, AlertTriangle } from "lucide-react";

export default async function NewMedicinePage() {
  const categoriesResult = await getCategories();
  const categories = categoriesResult.success ? categoriesResult.data : [];

  return (
    <Container className="py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Button asChild variant="link" className="p-0 h-auto mb-2 text-muted-foreground hover:text-primary">
            <Link href="/medicines" className="flex items-center gap-1">
              <ArrowRight className="w-4 h-4" /> الرجوع
            </Link>
          </Button>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2">
            إضافة <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">دواء جديد</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            احفظ الدواء ثم اطبع QR الخاص به للصقه على العلبة
          </p>
        </div>

        {categories.length === 0 && (
          <Alert variant="destructive" className="mb-6 bg-amber-500/10 text-amber-500 border-amber-500/20">
            <AlertTriangle className="h-4 w-4" color="currentColor" />
            <AlertDescription>
              ماكو فئات بعد.{" "}
              <Link href="/categories" className="font-bold underline hover:text-amber-400">
                أضف فئة أولاً
              </Link>{" "}
              قبل إضافة دواء.
            </AlertDescription>
          </Alert>
        )}

        <MedicineForm categories={categories} />
      </div>
    </Container>
  );
}
