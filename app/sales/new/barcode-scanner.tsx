"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function BarcodeScanner({
  onScan,
  enabled = true,
}: {
  onScan: (code: string) => void;
  enabled?: boolean;
}) {
  const containerId = "barcode-scanner-container";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const startedRef = useRef(false);
  const onScanRef = useRef(onScan);
  const enabledRef = useRef(enabled);
  const lastScanRef = useRef({ code: "", at: 0 });
  const [cameraError, setCameraError] = useState<string | null>(null);

  onScanRef.current = onScan;
  enabledRef.current = enabled;

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          if (!enabledRef.current) return;

          const code = decodedText.trim();
          const now = Date.now();
          if (
            code === lastScanRef.current.code &&
            now - lastScanRef.current.at < 1800
          ) {
            return;
          }

          lastScanRef.current = { code, at: now };
          onScanRef.current(code);
        },
        () => {}
      )
      .then(() => {
        startedRef.current = true;
        setCameraError(null);
      })
      .catch(() => {
        setCameraError(
          "ما قدرنا نفتح الكاميرا. اسمح بالصلاحية أو أدخل الباركود يدوياً."
        );
      });

    return () => {
      startedRef.current = false;
      void Promise.resolve(scanner.stop())
        .then(() => scanner.clear())
        .catch(() => {});
    };
  }, []);

  useEffect(() => {
    const scanner = scannerRef.current;
    if (!scanner || !startedRef.current) return;

    try {
      if (enabled) {
        scanner.resume();
      } else {
        scanner.pause(true);
      }
    } catch {
      // pause/resume قد يفشل إذا الكاميرا لسا ما اشتغلت
    }
  }, [enabled]);

  return (
    <div>
      <div
        id={containerId}
        style={{
          width: "100%",
          maxWidth: 360,
          margin: "0 auto",
          borderRadius: 12,
          overflow: "hidden",
          background: "#0b1220",
        }}
      />
      {cameraError ? (
        <p
          style={{
            textAlign: "center",
            fontSize: "0.85rem",
            color: "#fbbf24",
            marginTop: "0.75rem",
          }}
        >
          {cameraError}
        </p>
      ) : (
        <p
          style={{
            textAlign: "center",
            fontSize: "0.85rem",
            color: "#64748b",
            marginTop: "0.75rem",
          }}
        >
          وجّه كاميرا الموبايل نحو QR الدواء
        </p>
      )}
    </div>
  );
}
