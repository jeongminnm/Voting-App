import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  checkAdminPassword,
  createSessionToken,
} from "@/lib/admin-session";
import { type AdminLoginResponse, errorResponse, readJsonObject, withErrorResponse } from "@/lib/api";

export const POST = withErrorResponse(async (request: Request) => {
  const secret = process.env.ADMIN_TOKEN;
  if (!secret) {
    console.error("ADMIN_TOKEN 환경변수가 설정되지 않아 운영자 로그인을 처리할 수 없습니다.");
    return errorResponse(500, "운영자 로그인을 사용할 수 없습니다. 서버 설정을 확인해 주세요.");
  }

  const body = await readJsonObject(request);
  const password = body?.password;
  if (typeof password !== "string") return errorResponse(400, "요청 형식이 올바르지 않습니다.");

  if (!checkAdminPassword(password, secret)) return errorResponse(401, "비밀번호가 올바르지 않습니다.");

  const response = NextResponse.json({ ok: true } satisfies AdminLoginResponse);
  response.cookies.set(ADMIN_SESSION_COOKIE, createSessionToken(secret, Date.now()), adminSessionCookieOptions());
  return response;
});
