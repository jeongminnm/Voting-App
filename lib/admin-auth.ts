// 서버 컴포넌트에서 운영자 로그인 여부를 읽는다. 쿠키 확인 규칙은 lib/admin-session 에 있다.
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin-session";

export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return verifySessionToken(token, process.env.ADMIN_TOKEN, Date.now());
}
