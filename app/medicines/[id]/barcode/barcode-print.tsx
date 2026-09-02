"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";

export default function BarcodePrint({
  medicineName,
  barcode,
}: {
  medicineName: string;
  barcode: string;
}) {
  const router = useRouter();
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
    <div className="page-container fade-in" dir="rtl">
      <div className="card" style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
        <div className="card-header print-hidden">
          <h1 className="card-title">ملصق QR</h1>
        </div>
        <div className="card-body">
          <div className="print-label">
            <p style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.25rem" }}>{medicineName}</p>
            <p style={{ color: "#64748b", fontFamily: "monospace", marginBottom: "1rem" }}>{barcode}</p>
            <canvas ref={canvasRef} style={{ margin: "0 auto", background: "white", borderRadius: 8 }} />
          </div>

          <div className="print-hidden" style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
            <button onClick={() => window.print()} className="btn btn-primary" style={{ flex: 1 }}>
              طباعة
            </button>
            <button onClick={() => router.back()} className="btn btn-secondary" style={{ flex: 1 }}>
              رجوع
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
