import { describe, expect, it } from "vitest";
import type { PollOption } from "./polls";
import { calculateResults } from "./results";

function options(...counts: [string, number][]): PollOption[] {
  return counts.map(([label, vote_count], i) => ({ id: `id-${i}`, label, vote_count }));
}

function percents(result: ReturnType<typeof calculateResults>) {
  return Object.fromEntries(result.rows.map((row) => [row.label, row.percent]));
}

describe("calculateResults 총 투표수와 퍼센트", () => {
  it("0표면 총 0 이고 모든 선택지가 0% · 비율 0 이다", () => {
    const result = calculateResults(options(["A", 0], ["B", 0]));

    expect(result.total).toBe(0);
    expect(result.rows.map((row) => [row.percent, row.ratio])).toEqual([
      [0, 0],
      [0, 0],
    ]);
  });

  it("1개 선택지에 1표면 그 선택지가 100% · 비율 1, 나머지는 0% 다", () => {
    const result = calculateResults(options(["A", 0], ["B", 1]));

    expect(result.total).toBe(1);
    expect(percents(result)).toEqual({ A: 0, B: 100 });
    expect(result.rows.find((row) => row.label === "B")?.ratio).toBe(1);
  });

  it("1/3 은 33%, 2/3 는 67% 로 반올림하고 합계를 보정하지 않는다", () => {
    expect(percents(calculateResults(options(["A", 1], ["B", 2])))).toEqual({ A: 33, B: 67 });
    // 1표씩 3개: 33% × 3 = 99% (보정 없음)
    expect(percents(calculateResults(options(["A", 1], ["B", 1], ["C", 1])))).toEqual({ A: 33, B: 33, C: 33 });
  });

  it("1/8 은 12.5% 이므로 Math.round 로 13% 가 된다", () => {
    expect(percents(calculateResults(options(["A", 1], ["B", 7])))).toEqual({ A: 13, B: 88 });
  });

  it("막대 비율은 반올림 전의 정확한 값이다", () => {
    const result = calculateResults(options(["A", 1], ["B", 2]));

    expect(result.rows.find((row) => row.label === "A")?.ratio).toBe(1 / 3);
    expect(result.rows.find((row) => row.label === "B")?.ratio).toBe(2 / 3);
  });

  it("각 행은 선택지의 id, 이름, 득표수를 그대로 담는다", () => {
    const result = calculateResults(options(["치킨", 2]));

    expect(result.rows[0]).toMatchObject({ id: "id-0", label: "치킨", vote_count: 2 });
  });
});

describe("calculateResults 정렬", () => {
  function labels(result: ReturnType<typeof calculateResults>) {
    return result.rows.map((row) => row.label);
  }

  it("득표수가 많은 선택지부터 정렬한다", () => {
    expect(labels(calculateResults(options(["치킨", 1], ["피자", 5], ["짜장면", 3])))).toEqual(["피자", "짜장면", "치킨"]);
  });

  it("득표수가 같으면 같은 퍼센트이고 이름을 한국어 가나다순으로 정렬한다", () => {
    const result = calculateResults(options(["피자", 2], ["김밥", 2], ["치킨", 2]));

    expect(labels(result)).toEqual(["김밥", "치킨", "피자"]);
    expect(result.rows.map((row) => row.percent)).toEqual([33, 33, 33]);
  });

  it("0표일 때도 모든 선택지가 동률이므로 이름순이다", () => {
    expect(labels(calculateResults(options(["다", 0], ["가", 0], ["나", 0])))).toEqual(["가", "나", "다"]);
  });

  it("득표순과 동률 이름순을 함께 적용한다", () => {
    expect(labels(calculateResults(options(["라면", 1], ["우동", 3], ["국수", 1], ["냉면", 3])))).toEqual([
      "냉면",
      "우동",
      "국수",
      "라면",
    ]);
  });

  it("입력 배열을 바꾸지 않는다", () => {
    const input = options(["B", 1], ["A", 2]);

    calculateResults(input);

    expect(input.map((o) => o.label)).toEqual(["B", "A"]);
  });
});
