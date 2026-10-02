// دوال صغيرة حتى كل الـ actions ترجع النتيجة بنفس الشكل.
//
// نجاح:  { success: true,  data: ... }
// فشل:   { success: false, error: "رسالة الخطأ" }

export function ok<T = undefined>(data?: T) {
  return { success: true, data: data as T } as const;
}

export function fail(error: string) {
  return { success: false, error } as const;
}
