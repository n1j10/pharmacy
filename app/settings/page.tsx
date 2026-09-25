import { getSettings } from "@/lib/queries";
import SettingsForm from "./settings-form";
import Container from "@/components/global/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default async function SettingsPage() {
  const result = await getSettings();

  return (
    <Container className="py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">إعدادات الصيدلية</h1>
          <p className="text-muted-foreground mt-1">
            هذي البيانات تظهر في طباعة الفاتورة وواجهة النظام
          </p>
        </div>

        {!result.success ? (
          <p className="text-red-400">{result.error}</p>
        ) : (
          <Card className="border-white/10 shadow-sm bg-card/80">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-primary" />
                البيانات العامة
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <SettingsForm settings={result.data} />
            </CardContent>
          </Card>
        )}
      </div>
    </Container>
  );
}
