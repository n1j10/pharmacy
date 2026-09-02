import Link from "next/link";
import { notFound } from "next/navigation";
import { getMedicineById, getCategories } from "@/lib/actions/medicine-actions";
import EditMedicineForm from "./edit-form";

export default async function EditMedicinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [medicineResult, categoriesResult] = await Promise.all([
    getMedicineById(id),
    getCategories(),
  ]);

  if (!medicineResult.success) {
    notFound();
  }

  const categories = categoriesResult.success ? categoriesResult.data : [];

  return (
    <div className="page-container fade-in" dir="rtl">
      <div className="page-header">
        <div>
          <Link
            href={`/medicines/${id}`}
            className="link-primary"
            style={{ fontSize: "0.85rem" }}
          >
            ← الرجوع
          </Link>
          <h1 className="page-title" style={{ marginTop: "0.5rem" }}>
            تعديل {medicineResult.data.name}
          </h1>
        </div>
      </div>
      <EditMedicineForm medicine={medicineResult.data} categories={categories} />
    </div>
  );
}
