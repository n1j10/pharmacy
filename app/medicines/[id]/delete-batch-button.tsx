"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteBatch } from "@/lib/actions/medicine-actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

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
    <Button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      variant="destructive"
      size="sm"
    >
      {loading ? "..." : <Trash2 className="w-4 h-4" />}
    </Button>
  );
}


// turn into component