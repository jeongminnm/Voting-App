import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, adminSessionCookieOptions } from "@/lib/admin-session";
import { type AdminLoginResponse, withErrorResponse } from "@/lib/api";

export const POST = withErrorResponse(async () => {
  const response = NextResponse.json({ ok: true } satisfies AdminLoginResponse);
  response.cookies.set(ADMIN_SESSION_COOKIE, "", { ...adminSessionCookieOptions(), maxAge: 0 });
  return response;
});
