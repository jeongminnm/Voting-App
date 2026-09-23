// 투표(Poll) 관련 SQL 은 모두 이 모듈에 모은다. 서버 컴포넌트와 Route Handler 는 이 모듈로만 DB 에 접근한다.
import { sql } from "@/lib/db";

export type PollSummary = {
  id: string;
  question: string;
};

export type PollOption = {
  id: string;
  label: string;
  vote_count: number;
};

export type Poll = {
  id: string;
  question: string;
  created_at: string;
  options: PollOption[];
};

export type NewPoll = {
  question: string;
  options: string[];
};

// neon 드라이버는 행을 Record<string, any> 로만 돌려주므로, 각 SELECT 가 돌려주는 행 모양을 여기서 명시한다.
// (timestamptz 는 Date, integer 는 number 로 온다.)
type PollSummaryRow = { id: string; question: string };
type PollRow = { id: string; question: string; created_at: Date };
type OptionRow = { id: string; label: string; vote_count: number };
type IdRow = { id: string };
type PollIdRow = { poll_id: string };

export async function listPolls(): Promise<PollSummary[]> {
  const rows = (await sql`select id, question from polls order by created_at desc`) as PollSummaryRow[];
  return rows.map((row) => ({ id: row.id, question: row.question }));
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// uuid 형식이 아닌 id 는 DB 에 보내면 오류가 나므로, 조회 없이 "없음"으로 본다.
function isUuid(id: string): boolean {
  return UUID_PATTERN.test(id);
}

export async function getPoll(id: string): Promise<Poll | null> {
  if (!isUuid(id)) return null;

  const polls = (await sql`select id, question, created_at from polls where id = ${id}`) as PollRow[];
  if (polls.length === 0) return null;

  const poll = polls[0];
  // 선택지 표시 순서는 보장하지 않는다 (order by 없음, spec 참고).
  const options = (await sql`select id, label, vote_count from options where poll_id = ${id}`) as OptionRow[];
  return {
    id: poll.id,
    question: poll.question,
    created_at: poll.created_at.toISOString(),
    options: options.map((option) => ({ id: option.id, label: option.label, vote_count: option.vote_count })),
  };
}

// 그 투표에 속한 선택지일 때만 득표수를 1 올린다. vote_count + 1 은 원자적이라 동시 투표에도 누락되지 않는다.
export async function castVote(pollId: string, optionId: string): Promise<boolean> {
  if (!isUuid(pollId) || !isUuid(optionId)) return false;

  const rows = (await sql`
    update options set vote_count = vote_count + 1
    where id = ${optionId} and poll_id = ${pollId}
    returning id
  `) as IdRow[];
  return rows.length > 0;
}

// 투표와 선택지를 한 문장으로 저장해, 둘 중 하나만 저장되는 일이 없게 한다.
export async function createPoll(input: NewPoll): Promise<string> {
  const rows = (await sql`
    with new_poll as (
      insert into polls (question) values (${input.question}) returning id
    )
    insert into options (poll_id, label)
    select new_poll.id, label from new_poll, unnest(${input.options}::text[]) as label
    returning poll_id
  `) as PollIdRow[];
  return rows[0].poll_id;
}
