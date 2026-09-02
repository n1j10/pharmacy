"use client";

export default function PrintButton({ label = "طباعة" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-secondary">
      {label}
    </button>
  );
}
