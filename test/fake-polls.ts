// polls 데이터 접근 모듈(lib/polls)의 메모리 기반 가짜. 테스트에서 vi.mock 으로 대체한다.
import type { AdminPollSummary, NewPoll, Poll, PollSummary } from "@/lib/polls";

let polls: Poll[] = [];
let dbDown = false;

export function resetFakePolls() {
  polls = [];
  dbDown = false;
}

// 이후 모든 호출이 DB 오류처럼 예외를 던지게 한다.
export function simulateDbFailure() {
  dbDown = true;
}

function throwIfDbDown() {
  if (dbDown) throw new Error("simulated database failure");
}

export async function listPolls(): Promise<PollSummary[]> {
  throwIfDbDown();
  return [...polls]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(({ id, question }) => ({ id, question }));
}

export async function listAdminPolls(): Promise<AdminPollSummary[]> {
  throwIfDbDown();
  return [...polls]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((poll) => ({
      id: poll.id,
      question: poll.question,
      created_at: poll.created_at,
      closes_at: poll.closes_at,
      total_votes: poll.options.reduce((total, option) => total + option.vote_count, 0),
    }));
}

export async function getPoll(id: string): Promise<Poll | null> {
  throwIfDbDown();
  const poll = polls.find((p) => p.id === id);
  return poll ? structuredClone(poll) : null;
}

export async function castVote(pollId: string, optionId: string): Promise<boolean> {
  throwIfDbDown();
  const option = polls.find((p) => p.id === pollId)?.options.find((o) => o.id === optionId);
  if (!option) return false;
  option.vote_count += 1;
  return true;
}

export async function createPoll(input: NewPoll): Promise<string> {
  throwIfDbDown();
  const id = crypto.randomUUID();
  polls.push({
    id,
    question: input.question,
    created_at: new Date().toISOString(),
    closes_at: input.closesAt,
    options: input.options.map((label) => ({
      id: crypto.randomUUID(),
      label,
      vote_count: 0,
    })),
  });
  return id;
}
