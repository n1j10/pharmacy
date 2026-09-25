"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSettings } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Save } from "lucide-react";

type Settings = {
  pharmacyName: string;
  phone: string | null;
  address: string | null;
  receiptFooter: string | null;
  currency: string;
};

export default function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();

  const [pharmacyName, setPharmacyName] = useState(settings.pharmacyName);
  const [phone, setPhone] = useState(settings.phone || "");
  const [address, setAddress] = useState(settings.address || "");
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter || "");
  const [currency, setCurrency] = useState(settings.currency);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!pharmacyName.trim()) {
      setError("اسم الصيدلية مطلوب");
      return;
    }

    setLoading(true);
    const result = await updateSettings({
      pharmacyName,
      phone,
      address,
      receiptFooter,
      currency,
    });
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="pharmacyName">اسم الصيدلية</Label>
        <Input
          id="pharmacyName"
          value={pharmacyName}
          onChange={(e) => setPharmacyName(e.target.value)}
          className="mt-1"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="phone">الهاتف</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            dir="ltr"
            className="mt-1 text-left"
          />
        </div>
        <div>
          <Label htmlFor="currency">رمز العملة</Label>
          <Input
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="address">العنوان</Label>
        <Input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="receiptFooter">تذييل الإيصال</Label>
        <Input
          id="receiptFooter"
          value={receiptFooter}
          onChange={(e) => setReceiptFooter(e.target.value)}
          placeholder="شكراً لزيارتكم"
          className="mt-1"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && !error && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>تم حفظ الإعدادات بنجاح</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={loading} className="gap-2 w-fit">
        <Save className="w-4 h-4" />
        {loading ? "جاري الحفظ..." : "حفظ الإعدادات"}
      </Button>
    </form>
  );
}
