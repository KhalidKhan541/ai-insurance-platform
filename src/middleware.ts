import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const publicRoutes = ["/auth/login", "/auth/register", "/api/health", "/api/auth"];
const apiPublicRoutes = ["/api/health"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/auth") || pathname === "/api/health") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const response = NextResponse.next();
    response.headers.set("x-user-id", token.id as string);
    response.headers.set("x-user-role", token.role as string);
    return response;
  }

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set("x-user-id", token.id as string);
  response.headers.set("x-user-role", token.role as string);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
