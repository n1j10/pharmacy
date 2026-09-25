"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Container from "@/components/global/Container";
import { Printer, ArrowRight } from "lucide-react";

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
    <Container className="py-8 flex justify-center items-center min-h-[70vh]">
      <Card className="w-full max-w-md shadow-lg border-white/10 bg-card/95 text-center">
        <CardHeader className="print:hidden border-b border-border/50 pb-4">
          <CardTitle className="text-xl font-bold">ملصق QR</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center">
            <p className="font-extrabold text-xl mb-1">{medicineName}</p>
            <p className="text-muted-foreground font-mono text-sm mb-6 bg-foreground/5 px-3 py-1 rounded-md">{barcode}</p>
            <div className="bg-white p-2 rounded-xl shadow-sm">
              <canvas ref={canvasRef} className="mx-auto" />
            </div>
          </div>

          <div className="flex gap-4 mt-8 print:hidden">
            <Button onClick={() => window.print()} className="flex-1 gap-2" size="lg">
              <Printer className="w-5 h-5" />
              طباعة
            </Button>
            <Button onClick={() => router.back()} variant="secondary" className="flex-1 gap-2" size="lg">
              <ArrowRight className="w-5 h-5" />
              رجوع
            </Button>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}

//turn it to component