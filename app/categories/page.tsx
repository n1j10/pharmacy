import { getCategories } from "@/lib/actions/medicine-actions";
import CategoryManager from "./category-manager";
import Container from "@/components/global/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderTree } from "lucide-react";

export default async function CategoriesPage() {
  const result = await getCategories();
  const categories = result.success ? result.data : [];

  return (
    <Container className="py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">الفئات</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {categories.length} فئة مسجلة في النظام
          </p>
        </div>

        <Card className="border-white/10 shadow-sm bg-card/80">
          <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-primary" />
              إدارة الفئات
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <CategoryManager initialCategories={categories} />
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
