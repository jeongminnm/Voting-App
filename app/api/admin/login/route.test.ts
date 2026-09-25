import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifySessionToken } from "@/lib/admin-session";
import type { AdminLoginResponse, ApiError } from "@/lib/api";
import { readJson } from "@/test/read-json";
import { POST } from "./route";

function login(body: unknown) {
  return POST(
    new Request("http://localhost/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

function sessionCookie(res: Response): string | null {
  return res.headers.getSetCookie().find((cookie) => cookie.startsWith("admin_session=")) ?? null;
}

beforeEach(() => {
  vi.stubEnv("ADMIN_TOKEN", "Artificial");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/admin/login", () => {
  it("맞는 비밀번호면 200, { ok: true } 와 유효한 admin_session 쿠키를 돌려준다", async () => {
    const res = await login({ password: "Artificial" });

    expect(res.status).toBe(200);
    expect(await readJson<AdminLoginResponse>(res)).toEqual({ ok: true });

    const cookie = sessionCookie(res);
    expect(cookie).not.toBeNull();
    expect(cookie).toMatch(/;\s*HttpOnly/i);
    expect(cookie).toMatch(/;\s*Path=\//i);
    expect(cookie).toMatch(/;\s*Max-Age=28800/i);
    expect(cookie).toMatch(/;\s*SameSite=Lax/i);

    const token = decodeURIComponent(cookie!.split(";")[0].slice("admin_session=".length));
    expect(verifySessionToken(token, "Artificial", Date.now())).toBe(true);
  });

  it.each(["wrong", "", "artificial"])("비밀번호 %j 는 401 이고 쿠키를 설정하지 않는다", async (password) => {
    const res = await login({ password });

    expect(res.status).toBe(401);
    expect(await readJson<ApiError>(res)).toEqual({ error: "비밀번호가 올바르지 않습니다." });
    expect(sessionCookie(res)).toBeNull();
  });

  it.each([
    ["잘못된 JSON", "{not json"],
    ["password 누락", {}],
    ["password 가 문자열이 아님", { password: 1234 }],
    ["JSON 배열", ["Artificial"]],
  ])("%s → 400", async (_label, body) => {
    const res = await login(body);

    expect(res.status).toBe(400);
    expect(await readJson<ApiError>(res)).toEqual({ error: "요청 형식이 올바르지 않습니다." });
    expect(sessionCookie(res)).toBeNull();
  });

  it("ADMIN_TOKEN 이 설정되지 않으면 500 이고 로그인되지 않는다", async () => {
    vi.stubEnv("ADMIN_TOKEN", "");
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await login({ password: "" });

    expect(res.status).toBe(500);
    expect(await readJson<ApiError>(res)).toHaveProperty("error");
    expect(sessionCookie(res)).toBeNull();
  });
});
