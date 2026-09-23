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

export async function listPolls(): Promise<PollSummary[]> {
  const rows = await sql`select id, question from polls order by created_at desc`;
  return rows as PollSummary[];
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// uuid 형식이 아닌 id 는 DB 에 보내면 오류가 나므로, 조회 없이 "없음"으로 본다.
function isUuid(id: string): boolean {
  return UUID_PATTERN.test(id);
}

export async function getPoll(id: string): Promise<Poll | null> {
  if (!isUuid(id)) return null;

  const polls = await sql`select id, question, created_at from polls where id = ${id}`;
  if (polls.length === 0) return null;

  const poll = polls[0];
  const options = await sql`select id, label, vote_count from options where poll_id = ${id}`;
  return {
    id: poll.id,
    question: poll.question,
    created_at: new Date(poll.created_at).toISOString(),
    options: options as PollOption[],
  };
}

// 투표와 선택지를 한 문장으로 저장해, 둘 중 하나만 저장되는 일이 없게 한다.
export async function createPoll(input: NewPoll): Promise<string> {
  const rows = await sql`
    with new_poll as (
      insert into polls (question) values (${input.question}) returning id
    )
    insert into options (poll_id, label)
    select new_poll.id, label from new_poll, unnest(${input.options}::text[]) as label
    returning poll_id
  `;
  return rows[0].poll_id;
}
