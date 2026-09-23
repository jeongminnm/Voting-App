import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiError, CreatePollResponse } from "@/lib/api";
import type { Poll } from "@/lib/polls";
import { readJson } from "@/test/read-json";
import { resetFakePolls, simulateDbFailure } from "@/test/fake-polls";
import { POST } from "./route";
import { GET } from "./[id]/route";

vi.mock("@/lib/polls", () => import("@/test/fake-polls"));

function postPoll(body: unknown) {
  return POST(
    new Request("http://localhost/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

function getPoll(id: string) {
  return GET(new Request(`http://localhost/api/polls/${id}`), {
    params: Promise.resolve({ id }),
  });
}

beforeEach(() => {
  resetFakePolls();
});

describe("POST /api/polls", () => {
  it("투표를 만들면 201 과 id 를 돌려주고, 그 id 로 조회할 수 있다", async () => {
    const res = await postPoll({ question: "점심 메뉴는?", options: ["치킨", "피자"] });

    expect(res.status).toBe(201);
    const { id } = await readJson<CreatePollResponse>(res);

    const detail = await getPoll(id);
    expect(detail.status).toBe(200);
    const poll = await readJson<Poll>(detail);
    expect(poll.id).toBe(id);
    expect(poll.question).toBe("점심 메뉴는?");
    expect(typeof poll.created_at).toBe("string");
    expect(poll.options.map((o) => o.label).sort()).toEqual(["치킨", "피자"].sort());
    for (const option of poll.options) {
      expect(typeof option.id).toBe("string");
      expect(option.vote_count).toBe(0);
    }
  });
});

async function expectRejected(body: unknown) {
  const res = await postPoll(body);
  expect(res.status).toBe(400);
  const json = await readJson<ApiError>(res);
  expect(typeof json.error).toBe("string");
  expect(json.error.length).toBeGreaterThan(0);
}

describe("POST /api/polls 질문 검증", () => {
  it("질문과 선택지의 앞뒤 공백을 정리해서 저장한다", async () => {
    const res = await postPoll({ question: "  점심 메뉴는?  ", options: [" 치킨 ", "피자  "] });
    const { id } = await readJson<CreatePollResponse>(res);

    const poll = await readJson<Poll>(await getPoll(id));
    expect(poll.question).toBe("점심 메뉴는?");
    expect(poll.options.map((o) => o.label).sort()).toEqual(["치킨", "피자"].sort());
  });

  it("빈 질문을 거부한다", async () => {
    await expectRejected({ question: "", options: ["치킨", "피자"] });
  });

  it("공백뿐인 질문을 거부한다", async () => {
    await expectRejected({ question: "   ", options: ["치킨", "피자"] });
  });

  it("질문이 없으면 거부한다", async () => {
    await expectRejected({ options: ["치킨", "피자"] });
  });

  it("200자 질문은 허용한다", async () => {
    const res = await postPoll({ question: "가".repeat(200), options: ["치킨", "피자"] });
    expect(res.status).toBe(201);
  });

  it("201자 질문을 거부한다", async () => {
    await expectRejected({ question: "가".repeat(201), options: ["치킨", "피자"] });
  });
});

describe("POST /api/polls 선택지 검증", () => {
  it("선택지 2개와 5개는 허용한다", async () => {
    expect((await postPoll({ question: "Q", options: ["A", "B"] })).status).toBe(201);
    expect((await postPoll({ question: "Q", options: ["A", "B", "C", "D", "E"] })).status).toBe(201);
  });

  it("선택지가 1개면 거부한다", async () => {
    await expectRejected({ question: "Q", options: ["A"] });
  });

  it("선택지가 6개면 거부한다", async () => {
    await expectRejected({ question: "Q", options: ["A", "B", "C", "D", "E", "F"] });
  });

  it("선택지가 없으면 거부한다", async () => {
    await expectRejected({ question: "Q" });
  });

  it("빈 선택지를 거부한다", async () => {
    await expectRejected({ question: "Q", options: ["A", ""] });
  });

  it("공백뿐인 선택지를 거부한다", async () => {
    await expectRejected({ question: "Q", options: ["A", "   "] });
  });

  it("문자열이 아닌 선택지를 거부한다", async () => {
    await expectRejected({ question: "Q", options: ["A", 3] });
  });

  it("같은 투표 안의 중복 선택지 이름을 거부한다", async () => {
    await expectRejected({ question: "Q", options: ["치킨", "치킨"] });
  });

  it("공백을 정리하면 같아지는 선택지도 중복으로 거부한다", async () => {
    await expectRejected({ question: "Q", options: ["치킨", " 치킨 "] });
  });

  it("대소문자만 다른 선택지는 서로 다른 선택지로 허용한다", async () => {
    const res = await postPoll({ question: "Q", options: ["Pizza", "pizza"] });
    expect(res.status).toBe(201);
  });

  it("100자 선택지는 허용한다", async () => {
    const res = await postPoll({ question: "Q", options: ["가".repeat(100), "B"] });
    expect(res.status).toBe(201);
  });

  it("101자 선택지를 거부한다", async () => {
    await expectRejected({ question: "Q", options: ["가".repeat(101), "B"] });
  });

  it("거부된 투표는 저장되지 않는다", async () => {
    await postPoll({ question: "Q", options: ["A"] });

    const { listPolls } = await import("@/lib/polls");
    expect(await listPolls()).toEqual([]);
  });
});

describe("POST /api/polls 잘못된 요청", () => {
  it("JSON 이 아닌 본문을 거부한다", async () => {
    await expectRejected("{not json");
  });

  it("객체가 아닌 JSON 을 거부한다", async () => {
    await expectRejected("null");
  });
});

describe("GET /api/polls/[id]", () => {
  it("없는 투표는 404 와 한국어 error 를 돌려준다", async () => {
    const res = await getPoll("00000000-0000-4000-8000-000000000000");

    expect(res.status).toBe(404);
    const body = await readJson<ApiError>(res);
    expect(typeof body.error).toBe("string");
    expect(body.error.length).toBeGreaterThan(0);
  });

  it("형식이 잘못된 id 는 404 를 돌려준다", async () => {
    const res = await getPoll("not-a-uuid");

    expect(res.status).toBe(404);
    expect(typeof (await readJson<ApiError>(res)).error).toBe("string");
  });
});

describe("DB 오류", () => {
  it("POST /api/polls 는 500 과 한국어 error 를 돌려준다", async () => {
    simulateDbFailure();

    const res = await postPoll({ question: "Q", options: ["A", "B"] });

    expect(res.status).toBe(500);
    expect(typeof (await readJson<ApiError>(res)).error).toBe("string");
  });

  it("GET /api/polls/[id] 는 500 과 한국어 error 를 돌려준다", async () => {
    const { id } = await readJson<CreatePollResponse>(await postPoll({ question: "Q", options: ["A", "B"] }));
    simulateDbFailure();

    const res = await getPoll(id);

    expect(res.status).toBe(500);
    expect(typeof (await readJson<ApiError>(res)).error).toBe("string");
  });
});

describe("POST /api/polls 마감 시각 (closesAt)", () => {
  // 현재 시각을 2026-09-23 12:00 KST 로 고정한다.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-23T12:00:00+09:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("미래의 KST 마감 시각을 저장하고, GET 의 closes_at 이 같은 절대 시각이다", async () => {
    const res = await postPoll({ question: "Q", options: ["A", "B"], closesAt: "2026-09-30T18:00:00+09:00" });

    expect(res.status).toBe(201);
    const { id } = await readJson<CreatePollResponse>(res);
    const poll = await readJson<Poll>(await getPoll(id));
    expect(poll.closes_at).not.toBeNull();
    expect(Date.parse(poll.closes_at as string)).toBe(Date.parse("2026-09-30T09:00:00Z"));
  });

  it("closesAt 을 생략하면 closes_at 이 null 이다 (마감 없음)", async () => {
    const { id } = await readJson<CreatePollResponse>(await postPoll({ question: "Q", options: ["A", "B"] }));

    expect((await readJson<Poll>(await getPoll(id))).closes_at).toBeNull();
  });

  it("closesAt 이 null 이면 closes_at 이 null 이다 (마감 없음)", async () => {
    const res = await postPoll({ question: "Q", options: ["A", "B"], closesAt: null });

    expect(res.status).toBe(201);
    const { id } = await readJson<CreatePollResponse>(res);
    expect((await readJson<Poll>(await getPoll(id))).closes_at).toBeNull();
  });

  it("시간대가 없는 closesAt 을 거부한다", async () => {
    await expectRejected({ question: "Q", options: ["A", "B"], closesAt: "2026-09-30T18:00" });
  });

  it("형식이 잘못된 closesAt 을 거부한다", async () => {
    await expectRejected({ question: "Q", options: ["A", "B"], closesAt: "내일 저녁" });
    await expectRejected({ question: "Q", options: ["A", "B"], closesAt: "2026-13-45T25:00:00+09:00" });
  });

  it("문자열이 아닌 closesAt 을 거부한다", async () => {
    await expectRejected({ question: "Q", options: ["A", "B"], closesAt: 1790000000000 });
  });

  it("현재 시각과 같은 closesAt 을 거부한다", async () => {
    await expectRejected({ question: "Q", options: ["A", "B"], closesAt: "2026-09-23T12:00:00+09:00" });
  });

  it("과거의 closesAt 을 거부한다", async () => {
    await expectRejected({ question: "Q", options: ["A", "B"], closesAt: "2026-09-23T11:59:00+09:00" });
  });
});
