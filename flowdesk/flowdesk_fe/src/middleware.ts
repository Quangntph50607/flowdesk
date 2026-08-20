import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// TODO: Route protection logic
// - Redirect unauthenticated users away from protected routes
// - Redirect authenticated users away from auth pages (login, register)
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
