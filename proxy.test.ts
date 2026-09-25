import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_SESSION_MAX_AGE_SECONDS, createSessionToken } from "@/lib/admin-session";
import { config, proxy } from "./proxy";

function request(path: string, token?: string) {
  return new NextRequest(`http://localhost${path}`, {
    headers: token === undefined ? {} : { cookie: `admin_session=${token}` },
  });
}

function redirectTarget(res: Response): string | null {
  const location = res.headers.get("location");
  return location === null ? null : new URL(location).pathname;
}

beforeEach(() => {
  vi.stubEnv("ADMIN_TOKEN", "Artificial");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("proxy (/admin 경로 보호)", () => {
  it("matcher 는 /admin 경로만 대상으로 한다", () => {
    expect(config.matcher).toEqual(["/admin/:path*"]);
  });

  it("쿠키 없이 /admin 에 들어가면 /admin/login 으로 보낸다", () => {
    expect(redirectTarget(proxy(request("/admin")))).toBe("/admin/login");
  });

  it("유효한 쿠키로 /admin 에 들어가면 통과한다", () => {
    const res = proxy(request("/admin", createSessionToken("Artificial", Date.now())));
    expect(res.status).toBe(200);
    expect(redirectTarget(res)).toBeNull();
  });

  it("만료된 쿠키로 /admin 에 들어가면 /admin/login 으로 보낸다", () => {
    const expired = createSessionToken("Artificial", Date.now() - ADMIN_SESSION_MAX_AGE_SECONDS * 1000 - 1);
    expect(redirectTarget(proxy(request("/admin", expired)))).toBe("/admin/login");
  });

  it("위조한 쿠키로 /admin 에 들어가면 /admin/login 으로 보낸다", () => {
    const forged = createSessionToken("Guessed", Date.now());
    expect(redirectTarget(proxy(request("/admin", forged)))).toBe("/admin/login");
    expect(redirectTarget(proxy(request("/admin", "Artificial")))).toBe("/admin/login");
  });

  it("쿠키 없이 /admin/login 에 들어가면 통과한다", () => {
    const res = proxy(request("/admin/login"));
    expect(res.status).toBe(200);
    expect(redirectTarget(res)).toBeNull();
  });

  it("유효한 쿠키로 /admin/login 에 들어가면 /admin 으로 보낸다", () => {
    const res = proxy(request("/admin/login", createSessionToken("Artificial", Date.now())));
    expect(redirectTarget(res)).toBe("/admin");
  });

  it("ADMIN_TOKEN 이 없으면 쿠키가 있어도 /admin/login 으로 보낸다", () => {
    const token = createSessionToken("Artificial", Date.now());
    vi.stubEnv("ADMIN_TOKEN", "");
    expect(redirectTarget(proxy(request("/admin", token)))).toBe("/admin/login");
  });
});
