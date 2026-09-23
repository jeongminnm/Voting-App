import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiError, VoteResponse } from "@/lib/api";
import { createPoll, type Poll } from "@/lib/polls";
import { readJson } from "@/test/read-json";
import { resetFakePolls, simulateDbFailure } from "@/test/fake-polls";
import { GET } from "../route";
import { POST } from "./route";

vi.mock("@/lib/polls", () => import("@/test/fake-polls"));

function vote(pollId: string, body: unknown) {
  return POST(
    new Request(`http://localhost/api/polls/${pollId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: pollId }) },
  );
}

async function voteCounts(pollId: string): Promise<Record<string, number>> {
  const res = await GET(new Request(`http://localhost/api/polls/${pollId}`), {
    params: Promise.resolve({ id: pollId }),
  });
  const poll = await readJson<Poll>(res);
  return Object.fromEntries(
    poll.options.map((o) => [o.label, o.vote_count]),
  );
}

async function optionId(pollId: string, label: string): Promise<string> {
  const res = await GET(new Request(`http://localhost/api/polls/${pollId}`), {
    params: Promise.resolve({ id: pollId }),
  });
  const poll = await readJson<Poll>(res);
  const option = poll.options.find((o) => o.label === label);
  if (!option) throw new Error(`선택지 "${label}" 이(가) 없습니다.`);
  return option.id;
}

beforeEach(() => {
  resetFakePolls();
});

describe("POST /api/polls/[id]/vote", () => {
  it("투표하면 200 과 { ok: true } 를 돌려주고, 고른 선택지만 1 오른다", async () => {
    const pollId = await createPoll({ question: "점심 메뉴는?", options: ["치킨", "피자", "짜장면"], closesAt: null });

    const res = await vote(pollId, { optionId: await optionId(pollId, "피자") });

    expect(res.status).toBe(200);
    expect(await readJson<VoteResponse>(res)).toEqual({ ok: true });
    expect(await voteCounts(pollId)).toEqual({ 치킨: 0, 피자: 1, 짜장면: 0 });
  });

  it("같은 선택지에 두 번 투표하면 2 가 된다 (중복 투표 방지 없음, ADR-0001)", async () => {
    const pollId = await createPoll({ question: "점심 메뉴는?", options: ["치킨", "피자"], closesAt: null });
    const chicken = await optionId(pollId, "치킨");

    await vote(pollId, { optionId: chicken });
    await vote(pollId, { optionId: chicken });

    expect(await voteCounts(pollId)).toEqual({ 치킨: 2, 피자: 0 });
  });
});

describe("GET /api/polls/[id] 득표수 조회 (결과 화면이 쓰는 데이터)", () => {
  it("여러 선택지에 나뉜 득표수를 선택지별로 돌려준다", async () => {
    const pollId = await createPoll({ question: "점심 메뉴는?", options: ["치킨", "피자", "짜장면"], closesAt: null });
    const chicken = await optionId(pollId, "치킨");
    const pizza = await optionId(pollId, "피자");

    await vote(pollId, { optionId: chicken });
    await vote(pollId, { optionId: pizza });
    await vote(pollId, { optionId: chicken });

    expect(await voteCounts(pollId)).toEqual({ 치킨: 2, 피자: 1, 짜장면: 0 });
  });
});

describe("POST /api/polls/[id]/vote 거부", () => {
  async function expectRejected(res: Response, status: number) {
    expect(res.status).toBe(status);
    const json = await readJson<ApiError>(res);
    expect(typeof json.error).toBe("string");
    expect(json.error.length).toBeGreaterThan(0);
  }

  it("optionId 가 없으면 400 이고 득표수는 그대로다", async () => {
    const pollId = await createPoll({ question: "Q", options: ["A", "B"], closesAt: null });

    await expectRejected(await vote(pollId, {}), 400);
    expect(await voteCounts(pollId)).toEqual({ A: 0, B: 0 });
  });

  it("형식이 잘못된 optionId 는 400 이고 득표수는 그대로다", async () => {
    const pollId = await createPoll({ question: "Q", options: ["A", "B"], closesAt: null });

    await expectRejected(await vote(pollId, { optionId: "not-a-uuid" }), 400);
    await expectRejected(await vote(pollId, { optionId: 123 }), 400);
    expect(await voteCounts(pollId)).toEqual({ A: 0, B: 0 });
  });

  it("다른 투표의 선택지는 400 이고 두 투표의 득표수 모두 그대로다", async () => {
    const pollId = await createPoll({ question: "Q1", options: ["A", "B"], closesAt: null });
    const otherPollId = await createPoll({ question: "Q2", options: ["C", "D"], closesAt: null });

    await expectRejected(await vote(pollId, { optionId: await optionId(otherPollId, "C") }), 400);
    expect(await voteCounts(pollId)).toEqual({ A: 0, B: 0 });
    expect(await voteCounts(otherPollId)).toEqual({ C: 0, D: 0 });
  });

  it("없는 선택지는 400 이고 득표수는 그대로다", async () => {
    const pollId = await createPoll({ question: "Q", options: ["A", "B"], closesAt: null });

    await expectRejected(await vote(pollId, { optionId: "00000000-0000-4000-8000-000000000000" }), 400);
    expect(await voteCounts(pollId)).toEqual({ A: 0, B: 0 });
  });

  it("JSON 이 아니거나 객체가 아닌 본문은 400 이다", async () => {
    const pollId = await createPoll({ question: "Q", options: ["A", "B"], closesAt: null });

    await expectRejected(await vote(pollId, "{not json"), 400);
    await expectRejected(await vote(pollId, "null"), 400);
    expect(await voteCounts(pollId)).toEqual({ A: 0, B: 0 });
  });

  it("없는 투표는 404 다", async () => {
    await expectRejected(
      await vote("00000000-0000-4000-8000-000000000000", { optionId: "00000000-0000-4000-8000-000000000001" }),
      404,
    );
  });

  it("형식이 잘못된 투표 id 는 404 다", async () => {
    await expectRejected(await vote("not-a-uuid", { optionId: "00000000-0000-4000-8000-000000000001" }), 404);
  });
});

describe("POST /api/polls/[id]/vote DB 오류", () => {
  it("500 과 한국어 error 를 돌려준다", async () => {
    const pollId = await createPoll({ question: "Q", options: ["A", "B"], closesAt: null });
    const a = await optionId(pollId, "A");
    simulateDbFailure();

    const res = await vote(pollId, { optionId: a });

    expect(res.status).toBe(500);
    expect(typeof (await readJson<ApiError>(res)).error).toBe("string");
  });
});

describe("POST /api/polls/[id]/vote 마감", () => {
  // 마감 시각: 2026-09-30 18:00 KST
  const CLOSES_AT = "2026-09-30T09:00:00.000Z";

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function pollClosingAt(closesAt: string | null) {
    return createPoll({ question: "Q", options: ["A", "B"], closesAt });
  }

  async function expectClosed(res: Response) {
    expect(res.status).toBe(409);
    expect(await readJson<ApiError>(res)).toEqual({ error: "마감된 투표입니다." });
  }

  it("마감 전에는 투표할 수 있다", async () => {
    const pollId = await pollClosingAt(CLOSES_AT);
    vi.setSystemTime(new Date("2026-09-30T08:59:59.999Z"));

    const res = await vote(pollId, { optionId: await optionId(pollId, "A") });

    expect(res.status).toBe(200);
    expect(await voteCounts(pollId)).toEqual({ A: 1, B: 0 });
  });

  it("정확히 마감 시각이면 409 이고 득표수가 그대로다", async () => {
    const pollId = await pollClosingAt(CLOSES_AT);
    vi.setSystemTime(new Date(CLOSES_AT));

    await expectClosed(await vote(pollId, { optionId: await optionId(pollId, "A") }));
    expect(await voteCounts(pollId)).toEqual({ A: 0, B: 0 });
  });

  it("마감 후에는 409 이고 득표수가 그대로다", async () => {
    const pollId = await pollClosingAt(CLOSES_AT);
    vi.setSystemTime(new Date("2026-10-01T00:00:00Z"));

    await expectClosed(await vote(pollId, { optionId: await optionId(pollId, "B") }));
    expect(await voteCounts(pollId)).toEqual({ A: 0, B: 0 });
  });

  it("마감 시각이 없으면 기존처럼 투표할 수 있다", async () => {
    const pollId = await pollClosingAt(null);
    vi.setSystemTime(new Date("2099-01-01T00:00:00Z"));

    const res = await vote(pollId, { optionId: await optionId(pollId, "A") });

    expect(res.status).toBe(200);
    expect(await voteCounts(pollId)).toEqual({ A: 1, B: 0 });
  });

  it("없는 투표는 마감 판정보다 먼저 404 다", async () => {
    vi.setSystemTime(new Date("2026-10-01T00:00:00Z"));

    const res = await vote("00000000-0000-4000-8000-000000000000", { optionId: "not-a-uuid" });

    expect(res.status).toBe(404);
  });

  it("마감된 투표에 잘못된 optionId 를 보내면 400 이 아니라 409 다", async () => {
    const pollId = await pollClosingAt(CLOSES_AT);
    vi.setSystemTime(new Date("2026-10-01T00:00:00Z"));

    await expectClosed(await vote(pollId, { optionId: "not-a-uuid" }));
    await expectClosed(await vote(pollId, {}));
  });

  it("마감 전에 잘못된 optionId 를 보내면 400 이다", async () => {
    const pollId = await pollClosingAt(CLOSES_AT);
    vi.setSystemTime(new Date("2026-09-30T08:00:00Z"));

    const res = await vote(pollId, { optionId: "not-a-uuid" });

    expect(res.status).toBe(400);
    expect(await voteCounts(pollId)).toEqual({ A: 0, B: 0 });
  });
});
