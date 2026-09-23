import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPoll } from "@/lib/polls";
import { resetFakePolls } from "@/test/fake-polls";
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
  const poll = await res.json();
  return Object.fromEntries(
    poll.options.map((o: { label: string; vote_count: number }) => [o.label, o.vote_count]),
  );
}

async function optionId(pollId: string, label: string): Promise<string> {
  const res = await GET(new Request(`http://localhost/api/polls/${pollId}`), {
    params: Promise.resolve({ id: pollId }),
  });
  const poll = await res.json();
  return poll.options.find((o: { label: string }) => o.label === label).id;
}

beforeEach(() => {
  resetFakePolls();
});

describe("POST /api/polls/[id]/vote", () => {
  it("투표하면 200 과 { ok: true } 를 돌려주고, 고른 선택지만 1 오른다", async () => {
    const pollId = await createPoll({ question: "점심 메뉴는?", options: ["치킨", "피자", "짜장면"] });

    const res = await vote(pollId, { optionId: await optionId(pollId, "피자") });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(await voteCounts(pollId)).toEqual({ 치킨: 0, 피자: 1, 짜장면: 0 });
  });

  it("같은 선택지에 두 번 투표하면 2 가 된다 (중복 투표 방지 없음, ADR-0001)", async () => {
    const pollId = await createPoll({ question: "점심 메뉴는?", options: ["치킨", "피자"] });
    const chicken = await optionId(pollId, "치킨");

    await vote(pollId, { optionId: chicken });
    await vote(pollId, { optionId: chicken });

    expect(await voteCounts(pollId)).toEqual({ 치킨: 2, 피자: 0 });
  });
});

describe("GET /api/polls/[id] 득표수 조회 (결과 화면이 쓰는 데이터)", () => {
  it("여러 선택지에 나뉜 득표수를 선택지별로 돌려준다", async () => {
    const pollId = await createPoll({ question: "점심 메뉴는?", options: ["치킨", "피자", "짜장면"] });
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
    const json = await res.json();
    expect(typeof json.error).toBe("string");
    expect(json.error.length).toBeGreaterThan(0);
  }

  it("optionId 가 없으면 400 이고 득표수는 그대로다", async () => {
    const pollId = await createPoll({ question: "Q", options: ["A", "B"] });

    await expectRejected(await vote(pollId, {}), 400);
    expect(await voteCounts(pollId)).toEqual({ A: 0, B: 0 });
  });

  it("형식이 잘못된 optionId 는 400 이고 득표수는 그대로다", async () => {
    const pollId = await createPoll({ question: "Q", options: ["A", "B"] });

    await expectRejected(await vote(pollId, { optionId: "not-a-uuid" }), 400);
    await expectRejected(await vote(pollId, { optionId: 123 }), 400);
    expect(await voteCounts(pollId)).toEqual({ A: 0, B: 0 });
  });

  it("다른 투표의 선택지는 400 이고 두 투표의 득표수 모두 그대로다", async () => {
    const pollId = await createPoll({ question: "Q1", options: ["A", "B"] });
    const otherPollId = await createPoll({ question: "Q2", options: ["C", "D"] });

    await expectRejected(await vote(pollId, { optionId: await optionId(otherPollId, "C") }), 400);
    expect(await voteCounts(pollId)).toEqual({ A: 0, B: 0 });
    expect(await voteCounts(otherPollId)).toEqual({ C: 0, D: 0 });
  });

  it("없는 선택지는 400 이고 득표수는 그대로다", async () => {
    const pollId = await createPoll({ question: "Q", options: ["A", "B"] });

    await expectRejected(await vote(pollId, { optionId: "00000000-0000-4000-8000-000000000000" }), 400);
    expect(await voteCounts(pollId)).toEqual({ A: 0, B: 0 });
  });

  it("JSON 이 아니거나 객체가 아닌 본문은 400 이다", async () => {
    const pollId = await createPoll({ question: "Q", options: ["A", "B"] });

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
