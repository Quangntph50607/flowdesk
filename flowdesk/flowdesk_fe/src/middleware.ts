import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Zustand persist lưu vào localStorage (không đọc được ở edge)
  // Dùng cookie thủ công được set bởi app sau khi login
  const authToken = request.cookies.get("auth_token")?.value;
  const isLoggedIn = !!authToken;

  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // Chưa đăng nhập → chỉ được vào public routes
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Đã đăng nhập → không vào lại trang login/register
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
