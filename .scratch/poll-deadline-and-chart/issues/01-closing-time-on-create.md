# 01: 마감 시각 저장 + 생성 폼

**What to build:** 투표를 만드는 사람이 `/new` 에서 "마감 시간"을 선택적으로 입력할 수 있다. 입력한 날짜·시간은 항상 KST 로 해석되어 `+09:00` ISO 문자열(`closesAt`)로 서버에 전달되고, `polls.closes_at` 에 저장되며, `GET /api/polls/[id]` 응답의 `closes_at` 으로 확인된다. 비워 두면 마감 시각(Closing Time)이 없는 투표(Poll)가 되고, 기능 추가 전에 만든 투표도 마감 없음으로 계속 동작한다. 지금이거나 지난 시각은 화면과 서버 모두에서 거부된다. 이 티켓은 마감 여부 판정이나 투표 거부는 하지 않는다 (02).

스펙: `.scratch/poll-deadline-and-chart/spec.md` (User Stories 1–6, 14, 25–27)

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

### 스키마

- [ ] 스키마 SQL 파일에 마이그레이션 `alter table polls add column closes_at timestamptz;` 를 추가한다 (nullable, 기본값 없음). 다른 테이블·컬럼 변경은 없다.
- [ ] 구현 에이전트는 SQL 을 실행하지 않는다. 마이그레이션 SQL 을 사용자에게 보여주고 Neon SQL Editor 에서 직접 실행해 달라고 요청한 뒤, 실행 확인 후 DB 가 필요한 수동 확인을 진행한다.

### KST 변환 (ADR-0002)

- [ ] 서버·화면 공용 순수 함수로, `datetime-local` 값(`YYYY-MM-DDTHH:mm`)을 KST ISO 문자열(`YYYY-MM-DDTHH:mm:00+09:00`)로 바꾼다. 실행 환경의 시간대와 상관없이 같은 결과를 낸다.

### 입력 검증 (기존 투표 입력 검증 함수에 추가)

- [ ] `closesAt` 이 생략되거나 `null` 이면 마감 없음(`null`)으로 통과한다.
- [ ] `closesAt` 이 문자열이 아니거나, 시간대(`Z` 또는 `±HH:MM`)가 포함된 ISO 8601 형식이 아니면 거부한다.
- [ ] 현재 시각과 같거나 이전이면 "마감 시각은 지금 이후로 입력해 주세요." 로 거부한다. 서버는 요청을 받은 시점의 서버 시각으로 최종 판단한다.
- [ ] 화면(`/new`)과 서버(`POST /api/polls`)가 같은 검증 함수를 쓰고, 검증 결과 값에 마감 시각(없으면 `null`)을 포함한다.

### 데이터 / API

- [ ] polls 데이터 접근 모듈의 투표 생성이 마감 시각(또는 `null`)을 함께 저장한다. 투표와 선택지를 한 문장으로 저장하는 기존 방식은 유지한다.
- [ ] 투표 상세 조회가 `closes_at` (ISO 문자열 또는 `null`)을 함께 돌려준다.
- [ ] `POST /api/polls` 가 `{ question, options, closesAt?: string | null }` 을 받는다. `closesAt` 형식 오류·시간대 없음·지금 이전은 `400` 과 `{ error }` 이고, 나머지는 기존과 같다 (`201`, `{ id }`).
- [ ] `GET /api/polls/[id]` 응답이 `{ id, question, created_at, closes_at, options: [{ id, label, vote_count }] }` 이다.

### 화면

- [ ] `/new` 에 선택 입력 "마감 시간" (`datetime-local`)을 추가한다. 비워 두면 마감 없음이다.
- [ ] 제출 시 입력값을 KST ISO 문자열로 바꿔 `closesAt` 으로 보낸다. 비어 있으면 `closesAt` 을 보내지 않거나 `null` 로 보낸다.
- [ ] 지금이거나 지난 시각이면 화면에서 먼저 안내하고, 서버 오류 시 응답의 `error` 문구를 그대로 보여준다.
- [ ] 목록·투표·결과 화면은 이 티켓에서 바꾸지 않는다.

### 테스트

Route Handler 경계에서, polls 데이터 접근 모듈은 메모리 가짜로 대체한다. 가짜 모듈에 `closes_at` 을 추가하고, 현재 시각은 `vi.setSystemTime` 으로 고정한다.

- [ ] `closesAt` 이 미래 KST ISO → `201`, 이후 `GET` 의 `closes_at` 이 같은 절대 시각이다.
- [ ] `closesAt` 생략·`null` → `201`, `closes_at` 이 `null` 이다.
- [ ] 시간대 없음(`"2026-09-30T18:00"`), 형식 오류, 문자열 아님 → `400` + `{ error }`.
- [ ] 현재와 같음·과거 → `400` + `{ error }`.
- [ ] 순수 함수 경계: `2026-09-30T18:00` → `2026-09-30T18:00:00+09:00`.
- [ ] 기존 테스트를 포함해 `npm run test` 가 모두 통과한다.

### 수동 확인 (`npm run dev`)

- [ ] 마이그레이션 실행 후 마감 시간을 넣어 만든 투표의 `GET /api/polls/[id]` 에서 `closes_at` 이 입력한 KST 시각과 같은 절대 시각이다.
- [ ] 마감 시간을 비워 만든 투표와 기존 투표의 `closes_at` 이 `null` 이고 투표·결과가 기존처럼 동작한다.
- [ ] 지난 시각을 넣으면 화면에서 안내 문구가 보인다.
