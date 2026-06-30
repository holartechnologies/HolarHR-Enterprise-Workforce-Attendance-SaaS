import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { SessionUser } from "@/types";

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return {
    id: session.user.id as string,
    email: session.user.email as string,
    firstName: (session.user.name as string)?.split(" ")[0] || "",
    lastName: (session.user.name as string)?.split(" ").slice(1).join(" ") || "",
    role: session.user.role as SessionUser["role"],
    companyId: session.user.companyId as string,
    employeeId: session.user.employeeId as string | undefined,
  };
}

export function unauthorized() {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ success: false, error: message }, { status: 404 });
}

export function badRequest(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

export function ok<T>(data: T, message?: string) {
  return NextResponse.json({ success: true, data, message }, { status: 200 });
}

export function created<T>(data: T, message?: string) {
  return NextResponse.json({ success: true, data, message }, { status: 201 });
}

export function serverError(error?: unknown) {
  console.error("Server error:", error);
  return NextResponse.json(
    { success: false, error: "Internal server error" },
    { status: 500 }
  );
}

export function validatePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("perPage") || "10")));
  return { page, perPage, skip: (page - 1) * perPage, take: perPage };
}
