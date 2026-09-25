// 운영자 세션: DB 없이 ADMIN_TOKEN 으로 서명한 쿠키로 로그인 상태를 유지한다 (.scratch/admin-login/spec.md).
// Next.js 에 의존하지 않는 순수 함수라 Proxy·Route Handler·서버 컴포넌트·테스트에서 같이 쓴다.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  };
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

// 토큰 형식: "<만료 시각 epoch ms>.<HMAC-SHA256 서명>". ADMIN_TOKEN 원문은 넣지 않는다.
export function createSessionToken(secret: string, now: number): string {
  const expiresAt = String(now + ADMIN_SESSION_MAX_AGE_SECONDS * 1000);
  return `${expiresAt}.${sign(expiresAt, secret)}`;
}

// 형식·서명·만료를 모두 확인한다. 토큰이나 secret 이 없거나 하나라도 틀리면 false (예외 없음).
export function verifySessionToken(token: string | undefined, secret: string | undefined, now: number): boolean {
  if (!token || !secret) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [expiresAt, signature] = parts;
  if (!/^\d+$/.test(expiresAt)) return false;

  const expected = Buffer.from(sign(expiresAt, secret));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;

  return now < Number(expiresAt);
}

// 입력한 비밀번호가 ADMIN_TOKEN 과 같은지 상수 시간으로 비교한다 (대소문자 구분).
// 길이가 달라도 timingSafeEqual 이 예외를 던지지 않도록 같은 길이의 해시끼리 비교한다.
export function checkAdminPassword(input: string, secret: string | undefined): boolean {
  if (!secret) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(input), digest(secret));
}
