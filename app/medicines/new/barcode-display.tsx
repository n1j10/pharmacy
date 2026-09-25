"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Printer, Plus, ArrowRight } from "lucide-react";

interface BarcodeDisplayProps {
  medicineName: string;
  barcode: string;
  onDone: () => void;
  onAddAnother: () => void;
}

export default function BarcodeDisplay({medicineName,barcode,onDone,onAddAnother,}: BarcodeDisplayProps) {

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
    <Card className="max-w-md mx-auto shadow-lg border-emerald-500/20 bg-card/95 text-center mt-8">
      <CardContent className="pt-8 flex flex-col gap-6">
        <Alert className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
          <CheckCircle2 className="h-4 w-4" color="currentColor" />
          <AlertDescription className="font-bold">تم حفظ الدواء بنجاح — هذا QR خاص به فقط</AlertDescription>
        </Alert>

        <div className="flex flex-col items-center">
          <p className="font-extrabold text-xl mb-1">{medicineName}</p>
          <p className="text-muted-foreground font-mono text-sm mb-6 bg-foreground/5 px-3 py-1 rounded-md">{barcode}</p>
          <div className="bg-white p-2 rounded-xl shadow-sm">
            <canvas ref={canvasRef} className="mx-auto" />
          </div>
        </div>

        <div className="flex gap-4 print:hidden">
          <Button onClick={() => window.print()} variant="secondary" className="flex-1 gap-2">
            <Printer className="w-4 h-4" />
            طباعة الملصق
          </Button>
          
          <Button onClick={onAddAnother} className="flex-1 gap-2">
            <Plus className="w-4 h-4" />
            إضافة دواء آخر
          </Button>
        </div>

        <Button variant="link" onClick={onDone} className="print:hidden text-muted-foreground hover:text-primary gap-2 mx-auto">
          الرجوع لقائمة الأدوية <ArrowRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

//turn into components