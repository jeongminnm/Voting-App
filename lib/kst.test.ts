import { describe, expect, it } from "vitest";
import { formatKst, kstLocalToIso } from "./kst";

describe("kstLocalToIso", () => {
  it("datetime-local 값을 KST(+09:00) ISO 문자열로 바꾼다", () => {
    expect(kstLocalToIso("2026-09-30T18:00")).toBe("2026-09-30T18:00:00+09:00");
  });
});

describe("formatKst", () => {
  it("절대 시각을 KST 표시 문자열로 바꾼다", () => {
    expect(formatKst("2026-09-30T09:00:00Z")).toBe("2026-09-30 18:00 (KST)");
  });

  it("KST 로 자정을 넘기면 다음 날짜로 표시한다", () => {
    expect(formatKst("2026-09-30T15:00:00Z")).toBe("2026-10-01 00:00 (KST)");
  });
});
