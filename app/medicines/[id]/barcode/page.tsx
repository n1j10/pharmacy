import { notFound } from "next/navigation";
import { getMedicineById } from "@/lib/actions/medicine-actions";
import BarcodePrint from "./barcode-print";

export default async function MedicineBarcodePage({params}: {params: Promise<{ id: string }>;}) {
  const { id } = await params;

  const result = await getMedicineById(id);

  if (!result.success) {
    notFound();
  }

  return (
    <BarcodePrint medicineName={result.data.name} barcode={result.data.barcode} />
  );
}
