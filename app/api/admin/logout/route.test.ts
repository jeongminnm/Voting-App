import { describe, expect, it } from "vitest";
import type { AdminLoginResponse } from "@/lib/api";
import { readJson } from "@/test/read-json";
import { POST } from "./route";

function logout() {
  return POST();
}

function sessionCookie(res: Response): string | null {
  return res.headers.getSetCookie().find((cookie) => cookie.startsWith("admin_session=")) ?? null;
}

describe("POST /api/admin/logout", () => {
  it("로그인 여부와 관계없이 200 과 { ok: true } 를 돌려준다", async () => {
    const res = await logout();
    const secondRes = await logout();

    expect(res.status).toBe(200);
    expect(await readJson<AdminLoginResponse>(res)).toEqual({ ok: true });
    expect(secondRes.status).toBe(200);
    expect(await readJson<AdminLoginResponse>(secondRes)).toEqual({ ok: true });
  });

  it("admin_session 쿠키를 Path=/ 와 Max-Age=0 으로 삭제한다", async () => {
    const res = await logout();
    const cookie = sessionCookie(res);

    expect(cookie).not.toBeNull();
    expect(cookie).toMatch(/;\s*Max-Age=0/i);
    expect(cookie).toMatch(/;\s*Path=\//i);
  });
});
