import Link from "next/link";
import { notFound } from "next/navigation";
import { getMedicineById, getCategories } from "@/lib/actions/medicine-actions";
import EditMedicineForm from "./edit-form";
import Container from "@/components/global/Container";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default async function EditMedicinePage({params,}: {params: Promise<{ id: string }>;}) {
  const { id } = await params;

  const [medicineResult, categoriesResult] = await Promise.all([getMedicineById(id),getCategories(),
  ]);

  if (!medicineResult.success) {
    notFound();
  }

  const categories = categoriesResult.success ? categoriesResult.data : [];

  return (
    <Container className="py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Button asChild variant="link" className="p-0 h-auto mb-2 text-muted-foreground hover:text-primary">
            <Link href={`/medicines/${id}`} className="flex items-center gap-1">
              <ArrowRight className="w-4 h-4" /> الرجوع
            </Link>
          </Button>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2">
            تعديل <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{medicineResult.data.name}</span>
          </h1>
        </div>
        
        <EditMedicineForm medicine={medicineResult.data} categories={categories} />
      </div>
    </Container>
  );
}
