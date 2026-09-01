import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Zustand persist lưu vào localStorage — không đọc được trong middleware.
  // Dùng cookie "flowdesk-token" được set sau khi login thành công (từ use-auth.ts).
  const authToken = request.cookies.get("flowdesk-token")?.value;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Chưa đăng nhập, truy cập trang bảo vệ → về login
  if (!authToken && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Đã đăng nhập, vào lại login/register → redirect về dashboard
  // (dashboard sẽ redirect tiếp theo role)
  if (authToken && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|placeholder.svg).*)",
  ],
};
