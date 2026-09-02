"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export default function BarcodeDisplay({
  medicineName,
  barcode,
  onDone,
  onAddAnother,
}: {
  medicineName: string;
  barcode: string;
  onDone: () => void;
  onAddAnother: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, barcode, {
        width: 220,
        margin: 2,
        color: { dark: "#0f172a", light: "#ffffff" },
      });
    }
  }, [barcode]);

  return (
    <div className="card" style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }} dir="rtl">
      <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className="alert alert-success">
          <span>✓</span>
          <span>تم حفظ الدواء بنجاح — هذا QR خاص به فقط</span>
        </div>

        <div className="print-label">
          <p style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.25rem" }}>{medicineName}</p>
          <p style={{ color: "#64748b", fontFamily: "monospace", marginBottom: "1rem" }}>{barcode}</p>
          <canvas ref={canvasRef} style={{ margin: "0 auto", background: "white", borderRadius: 8 }} />
        </div>

        <div className="print-hidden" style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => window.print()} className="btn btn-secondary" style={{ flex: 1 }}>
            طباعة الملصق
          </button>
          <button onClick={onAddAnother} className="btn btn-primary" style={{ flex: 1 }}>
            إضافة دواء آخر
          </button>
        </div>

        <button onClick={onDone} className="link-primary print-hidden" style={{ background: "none", border: "none", cursor: "pointer" }}>
          الرجوع لقائمة الأدوية
        </button>
      </div>
    </div>
  );
}
