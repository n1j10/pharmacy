"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMedicine } from "@/lib/actions/medicine-actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function DeleteMedicineButton({
  medicineId,
}: {
  medicineId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      "متأكد تريد تحذف هذا الدواء؟ هذا الإجراء ما يرجع للخلف."
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    const result = await deleteMedicine(medicineId);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push("/medicines");
  }

  return (
    <div>
      <Button
        onClick={handleDelete}
        disabled={loading}
        variant="destructive"
        className="gap-2"
      >
        <Trash2 className="w-4 h-4" />
        {loading ? "جاري الحذف..." : "حذف"}
      </Button>
      {error && (
        <p className="text-red-500 text-sm mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

// turn into component