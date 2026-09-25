// /admin 경로 보호 (Next.js 16 의 Proxy, 예전 middleware). 쿠키만 읽는 낙관적 검사이고,
// /admin 페이지도 서버에서 로그인 여부를 다시 확인한다 (.scratch/admin-login/spec.md).
import { type NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin-session";

export function proxy(request: NextRequest) {
  const loggedIn = verifySessionToken(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
    process.env.ADMIN_TOKEN,
    Date.now(),
  );

  if (request.nextUrl.pathname === "/admin/login") {
    return loggedIn ? NextResponse.redirect(new URL("/admin", request.url)) : NextResponse.next();
  }
  if (!loggedIn) return NextResponse.redirect(new URL("/admin/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
