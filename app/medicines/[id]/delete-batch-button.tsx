"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteBatch } from "@/lib/actions/medicine-actions";

export default function DeleteBatchButton({ batchId }: { batchId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm("متأكد تريد تحذف هذي الدفعة؟");
    if (!confirmed) return;

    setLoading(true);
    const result = await deleteBatch(batchId);
    setLoading(false);

    if (!result.success) {
      window.alert(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="btn btn-danger btn-sm"
    >
      {loading ? "..." : "حذف"}
    </button>
  );
}
