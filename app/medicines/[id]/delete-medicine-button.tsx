"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMedicine } from "@/lib/actions/medicine-actions";

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
      <button
        onClick={handleDelete}
        disabled={loading}
        className="btn btn-danger"
      >
        {loading ? "جاري الحذف..." : "حذف"}
      </button>
      {error && (
        <p style={{ color: "#f87171", fontSize: "0.85rem", marginTop: "0.35rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}
