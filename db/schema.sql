-- 투표 앱 스키마 (수업자료 2장). Neon SQL Editor 에서 직접 실행한다.
create table polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  created_at timestamptz not null default now()
);

create table options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  label text not null,
  vote_count integer not null default 0
);
