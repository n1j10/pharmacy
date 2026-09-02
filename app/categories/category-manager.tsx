"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/actions/medicine-actions";

type Category = {
  id: string;
  name: string;
  _count?: { medicines: number };
};

export default function CategoryManager({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
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
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Add Form */}
      <form
        onSubmit={handleAdd}
        style={{ display: "flex", gap: "0.75rem" }}
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="اسم فئة جديدة..."
          className="form-input"
          style={{ flex: 1 }}
        />
        <button
          disabled={loading}
          type="submit"
          className="btn btn-primary"
        >
          {loading ? "جاري الإضافة..." : "➕ إضافة"}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="alert alert-error">
          <span>❌</span>
          <span>{error}</span>
        </div>
      )}

      {/* Categories List */}
      <div
        style={{
          border: "1px solid var(--dark-border)",
          borderRadius: 12,
          overflow: "hidden",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        {initialCategories.length === 0 ? (
          <div className="empty-state" style={{ padding: "2rem" }}>
            <div className="empty-state-icon" style={{ fontSize: "2rem" }}>🗂️</div>
            <div className="empty-state-title">لا توجد فئات بعد</div>
          </div>
        ) : (
          initialCategories.map((cat) => (
            <div key={cat.id} className="category-item">
              {editingId === cat.id ? (
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="form-input"
                  style={{ flex: 1, marginLeft: "0.75rem" }}
                  autoFocus
                />
              ) : (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "rgba(14,165,233,0.1)",
                      border: "1px solid rgba(14,165,233,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.9rem",
                    }}
                  >
                    🗂️
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: "#e2e8f0" }}>
                      {cat.name}
                    </div>
                    {cat._count && (
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {cat._count.medicines} دواء
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  flexShrink: 0,
                  marginRight: editingId === cat.id ? 0 : "auto",
                  marginLeft: 0,
                }}
              >
                {editingId === cat.id ? (
                  <>
                    <button
                      onClick={() => handleUpdate(cat.id)}
                      className="btn btn-success btn-sm"
                    >
                      ✓ حفظ
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="btn btn-secondary btn-sm"
                    >
                      إلغاء
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditingName(cat.name);
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      ✏️ تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="btn btn-danger btn-sm"
                    >
                      🗑️ حذف
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
