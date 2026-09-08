"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/actions/medicine-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus, FolderTree, Edit2, Trash2, Check, X } from "lucide-react";

type Category = {
  id: string;
  name: string;
  _count?: { medicines: number };
};

export default function CategoryManager({initialCategories,}: {initialCategories: Category[];}) {
  const router = useRouter();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!newName.trim()) {
      setError("اسم الفئة مطلوب");
      return;
    }
    setLoading(true);
    const result = await createCategory(newName);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    setNewName("");
    router.refresh();
  }

  async function handleUpdate(id: string) {
    setError(null);
    if (!editingName.trim()) {
      setError("اسم الفئة مطلوب");
      return;
    }
    const result = await updateCategory(id, editingName);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("متأكد تريد تحذف هذي الفئة؟");
    if (!confirmed) return;

    const result = await deleteCategory(id);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Add Form */}
      <form
        onSubmit={handleAdd}
        className="flex gap-3"
      >
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="اسم فئة جديدة..."
          className="flex-1"
        />
        <Button
          disabled={loading}
          type="submit"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          {loading ? "جاري الإضافة..." : "إضافة"}
        </Button>
      </form>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Categories List */}
      <div className="border border-border/50 rounded-xl overflow-hidden bg-background/50">
        {initialCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderTree className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <h3 className="text-lg font-bold text-foreground">لا توجد فئات بعد</h3>
            <p className="text-sm text-muted-foreground mt-1">ابدأ بإضافة أول فئة أعلاه</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">


            {initialCategories.map((cat) => (
              <div key={cat.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-muted/30 transition-colors">


                {editingId === cat.id ? (
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 sm:ml-3"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <FolderTree className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">
                        {cat.name}
                      </div>
                      {cat._count !== undefined && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {cat._count.medicines} دواء
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div
                  className={`flex gap-2 shrink-0 ${
                    editingId === cat.id ? "mr-0" : "sm:mr-auto"
                  }`}
                >
                  {editingId === cat.id ? (
                    <>
                      <Button
                        onClick={() => handleUpdate(cat.id)}
                        variant="default"
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                      >
                        <Check className="w-4 h-4" /> حفظ
                      </Button>
                      <Button
                        onClick={() => setEditingId(null)}
                        variant="secondary"
                        size="sm"
                        className="gap-1"
                      >
                        <X className="w-4 h-4" /> إلغاء
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditingName(cat.name);
                        }}
                        variant="secondary"
                        size="sm"
                        className="gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> تعديل
                      </Button>
                      <Button
                        onClick={() => handleDelete(cat.id)}
                        variant="destructive"
                        size="sm"
                        className="gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> حذف
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

//turn into components