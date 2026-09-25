import { getUsers } from "@/lib/queries";
import Container from "@/components/global/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserManager from "./user-manager";

export default async function UsersPage() {
  const result = await getUsers();
  const users = result.success ? result.data : [];

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">الموظفون</h1>
        <p className="text-muted-foreground mt-1">إضافة بائع أو مدير وتعطيل الحسابات</p>
      </div>
      {!result.success && <p className="mb-4 text-red-400">{result.error}</p>}
      <Card>
        <CardHeader>
          <CardTitle>إدارة الحسابات</CardTitle>
        </CardHeader>
        <CardContent>
          <UserManager users={users} />
        </CardContent>
      </Card>
    </Container>
  );
}
