"use client";

export type CartItem = {
  barcode: string;
  name: string;
  price: number;
  quantity: number;
  available: number;
};

export default function Cart({
  items,
  onQuantityChange,
  onRemove,
}: {
  items: CartItem[];
  onQuantityChange: (barcode: string, quantity: number) => void;
  onRemove: (barcode: string) => void;
}) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="empty-state" style={{ padding: "1.5rem 1rem" }}>
        <div className="empty-state-icon">🛒</div>
        <div className="empty-state-title">السلة فارغة</div>
        <div className="empty-state-desc">امسح QR الدواء أو أدخل الباركود</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {items.map((item) => (
        <div
          key={item.barcode}
          className="category-item"
          style={{
            border: "1px solid var(--dark-border)",
            borderRadius: 12,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 700, color: "#f1f5f9" }}>{item.name}</p>
            <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
              {item.price.toLocaleString()} د.ع × {item.quantity} — المتوفر{" "}
              {item.available}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="number"
              min={1}
              max={item.available}
              value={item.quantity}
              onChange={(e) =>
                onQuantityChange(item.barcode, Number(e.target.value))
              }
              className="form-input"
              style={{ width: 72, textAlign: "center" }}
            />
            <button
              type="button"
              onClick={() => onRemove(item.barcode)}
              className="btn btn-danger btn-sm"
            >
              حذف
            </button>
          </div>
        </div>
      ))}

      <div
        style={{
          borderTop: "1px solid var(--dark-border)",
          paddingTop: "0.85rem",
          display: "flex",
          justifyContent: "space-between",
          fontWeight: 800,
          fontSize: "1.1rem",
        }}
      >
        <span>المجموع</span>
        <span style={{ color: "#34d399" }}>{total.toLocaleString()} د.ع</span>
      </div>
    </div>
  );
}
