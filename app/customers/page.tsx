import { getCustomers } from "@/lib/queries";
import CustomerManager from "./customer-manager";
import Container from "@/components/global/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default async function CustomersPage() {
  const result = await getCustomers();
  const customers = result.success ? result.data : [];

  return (
    <Container className="py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              الزبائن
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">{customers.length} زبون مسجل في النظام</p>
        </div>

        {!result.success && <p className="mb-4 text-red-400">{result.error}</p>}

        <Card className="border-white/10 shadow-sm bg-card/80">
          <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              إدارة الزبائن
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <CustomerManager customers={customers} />
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
