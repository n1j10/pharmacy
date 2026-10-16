import { redirect } from "next/navigation";

// أشياء صغيرة نستخدمها بأكثر من ملف actions.
// (ملف عادي مو ملف server actions، حتى يكدر يصدّر أي شي.)

// يحول أي خطأ لـ { message } بسيطة تعرضها الفورمات.
export const renderError = (error: unknown): { message: string } => {
  console.error("SERVER ACTION ERROR:", error);
  return {
    message: error instanceof Error ? error.message : "Unknown Error",
  };
};

// يشغّل الشغل ويرجع { message }:
// - إذا نجح: رسالة النجاح اللي ترجعها الدالة.
// - إذا صار خطأ: رسالة الخطأ.
// (هذا نفس try/catch اللي كنا نكتبه بكل action، بس مرة وحدة هنا.)
export const runAction = async (work: () => Promise<string>) => {
  try {
    return { message: await work() };
  } catch (error) {
    return renderError(error);
  }
};

// إذا الشي مو موجود (null) يروح للصفحة، وإذا موجود يرجعه.
export const orRedirect = <T>(item: T | null, path: string): T => {
  if (!item) redirect(path);
  return item;
};

// بحث بالنص بدون اهتمام بحالة الأحرف (a = A).
// الاستخدام: where: { name: search ? contains(search) : undefined }
// (أي فلتر قيمته undefined يتجاهله Prisma.)
export const contains = (text: string) =>
  ({ contains: text, mode: "insensitive" } as const);

// الدفعات المتوفرة وغير المنتهية (نستخدمها بالبيع وبجلب الدواء بالباركود).
export const availableBatches = () => ({
  quantity: { gt: 0 },
  expiryDate: { gt: new Date() },
});
