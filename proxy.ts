import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // الصفحات المخصصة لـ ADMIN بس (إدارة الفئات، إضافة/تعديل الأدوية)
    const isAdminOnly =
      path.startsWith("/categories") ||
      path === "/medicines/new" ||
      (path.startsWith("/medicines/") && path.endsWith("/edit")) ||
      (path.startsWith("/medicines/") && path.endsWith("/barcode"));

    if (isAdminOnly && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // لازم يكون مسجل دخول (عنده token) عشان يوصل لأي مسار بالـ matcher بالأسفل
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

// الصفحات اللي تحتاج تسجيل دخول (كل شي عدا /login و /api/otp و /api/auth)
export const config = {
  matcher: [
    "/",
    "/medicines/:path*",
    "/categories/:path*",
    "/sales/:path*",
  ],
};
