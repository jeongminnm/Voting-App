// polls 데이터 접근 모듈(lib/polls)의 메모리 기반 가짜. 테스트에서 vi.mock 으로 대체한다.
import type { NewPoll, Poll, PollSummary } from "@/lib/polls";

let polls: Poll[] = [];

export function resetFakePolls() {
  polls = [];
}

export async function listPolls(): Promise<PollSummary[]> {
  return [...polls]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(({ id, question }) => ({ id, question }));
}

export async function getPoll(id: string): Promise<Poll | null> {
  const poll = polls.find((p) => p.id === id);
  return poll ? structuredClone(poll) : null;
}

export async function castVote(pollId: string, optionId: string): Promise<boolean> {
  const option = polls.find((p) => p.id === pollId)?.options.find((o) => o.id === optionId);
  if (!option) return false;
  option.vote_count += 1;
  return true;
}

export async function createPoll(input: NewPoll): Promise<string> {
  const id = crypto.randomUUID();
  polls.push({
    id,
    question: input.question,
    created_at: new Date().toISOString(),
    options: input.options.map((label) => ({
      id: crypto.randomUUID(),
      label,
      vote_count: 0,
    })),
  });
  return id;
}
