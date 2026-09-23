import { describe, expect, it } from "vitest";
import { kstLocalToIso } from "./kst";

describe("kstLocalToIso", () => {
  it("datetime-local 값을 KST(+09:00) ISO 문자열로 바꾼다", () => {
    expect(kstLocalToIso("2026-09-30T18:00")).toBe("2026-09-30T18:00:00+09:00");
  });
});
