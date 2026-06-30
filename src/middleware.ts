import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const secret = process.env.NEXTAUTH_SECRET;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret });

  if (
    (pathname.startsWith("/api/admin") || pathname.startsWith("/admin")) &&
    token?.role !== "SUPER_ADMIN"
  ) {
    return pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      : NextResponse.redirect(new URL("/login", req.url));
  }

  if (
    pathname.startsWith("/api/billing") &&
    !["COMPANY_ADMIN", "SUPER_ADMIN"].includes(token?.role as string)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const response = NextResponse.next();
  if (token?.companyId) {
    response.headers.set("x-company-id", token.companyId as string);
  }
  response.headers.set("x-user-role", token?.role as string);

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/employees/:path*",
    "/api/attendance/:path*",
    "/api/reports/:path*",
    "/api/billing/:path*",
    "/api/ai/:path*",
    "/api/branches/:path*",
    "/api/departments/:path*",
    "/api/shifts/:path*",
    "/api/leave/:path*",
    "/api/admin/:path*",
    "/admin/:path*",
  ],
};
