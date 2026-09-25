import { describe, expect, it } from "vitest";
import {
  ADMIN_SESSION_MAX_AGE_SECONDS,
  checkAdminPassword,
  createSessionToken,
  verifySessionToken,
} from "./admin-session";

const SECRET = "Artificial";
const NOW = Date.UTC(2026, 8, 25, 0, 0, 0);
const EXPIRES_AT = NOW + ADMIN_SESSION_MAX_AGE_SECONDS * 1000;

describe("세션 토큰", () => {
  it("만든 토큰은 만료 전까지 유효하다", () => {
    const token = createSessionToken(SECRET, NOW);
    expect(verifySessionToken(token, SECRET, NOW)).toBe(true);
    expect(verifySessionToken(token, SECRET, EXPIRES_AT - 1)).toBe(true);
  });

  it("만료 시각 정각과 이후에는 무효다 (8시간)", () => {
    const token = createSessionToken(SECRET, NOW);
    expect(verifySessionToken(token, SECRET, EXPIRES_AT)).toBe(false);
    expect(verifySessionToken(token, SECRET, EXPIRES_AT + 1)).toBe(false);
  });

  it("토큰에 ADMIN_TOKEN 원문이 들어가지 않는다", () => {
    expect(createSessionToken(SECRET, NOW)).not.toContain(SECRET);
  });

  it("서명을 바꾸면 무효다", () => {
    const [expiresAt, signature] = createSessionToken(SECRET, NOW).split(".");
    const tampered = signature.endsWith("A") ? `${signature.slice(0, -1)}B` : `${signature.slice(0, -1)}A`;
    expect(verifySessionToken(`${expiresAt}.${tampered}`, SECRET, NOW)).toBe(false);
  });

  it("만료 시각(페이로드)을 늘리면 무효다", () => {
    const [expiresAt, signature] = createSessionToken(SECRET, NOW).split(".");
    const extended = String(Number(expiresAt) + 1000 * 60 * 60 * 24);
    expect(verifySessionToken(`${extended}.${signature}`, SECRET, NOW)).toBe(false);
  });

  it.each([undefined, "", "abc", "123", "a.b", "1.2.3", `${EXPIRES_AT}.`, `.${EXPIRES_AT}`])(
    "형식이 잘못된 토큰 %j 는 예외 없이 무효다",
    (token) => {
      expect(verifySessionToken(token, SECRET, NOW)).toBe(false);
    },
  );

  it("다른 ADMIN_TOKEN 으로 만든 토큰은 무효다", () => {
    const token = createSessionToken("Other", NOW);
    expect(verifySessionToken(token, SECRET, NOW)).toBe(false);
  });

  it("ADMIN_TOKEN 이 없으면 모든 토큰이 무효다", () => {
    const token = createSessionToken(SECRET, NOW);
    expect(verifySessionToken(token, undefined, NOW)).toBe(false);
    expect(verifySessionToken(token, "", NOW)).toBe(false);
  });
});

describe("비밀번호 확인", () => {
  it("ADMIN_TOKEN 과 같으면 true", () => {
    expect(checkAdminPassword("Artificial", SECRET)).toBe(true);
  });

  it.each(["artificial", "ARTIFICIAL", "", "Artificia", "Artificial ", "완전히 다른 길이의 비밀번호"])(
    "%j 는 false (대소문자 구분, 길이가 달라도 예외 없음)",
    (input) => {
      expect(checkAdminPassword(input, SECRET)).toBe(false);
    },
  );

  it("ADMIN_TOKEN 이 없으면 어떤 입력도 false", () => {
    expect(checkAdminPassword("", undefined)).toBe(false);
    expect(checkAdminPassword("Artificial", undefined)).toBe(false);
    expect(checkAdminPassword("", "")).toBe(false);
  });
});
