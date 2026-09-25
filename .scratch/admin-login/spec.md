# Spec: 운영자 로그인 + 읽기 전용 운영자 대시보드

Status: ready-for-agent

## Problem Statement

지금 투표 앱에는 운영자가 없다. 누구나 투표(Poll)를 만들고 투표할 수 있지만, 동아리 운영진이 전체 투표 현황(어떤 투표가 진행 중이고 마감됐는지, 각 투표에 몇 표가 모였는지)을 한 화면에서 볼 방법이 없다. 수업 영상의 관리자 흐름처럼 운영자만 들어갈 수 있는 화면이 필요하다.

## Solution

- 투표 목록(`/`)에 "운영자 로그인" 링크를 둔다.
- 운영자는 `/admin/login` 에서 비밀번호를 입력해 로그인한다. 비밀번호는 환경변수 `ADMIN_TOKEN` 과 비교한다.
- 로그인하면 `/admin` 운영자 대시보드로 이동해 전체 투표 현황을 **읽기 전용**으로 본다.
- 대시보드에서 투표 목록으로 돌아가도 로그인이 유지된다. 이때 목록에는 "운영자 로그인" 대신 "운영자 대시보드" 링크와 "로그아웃" 버튼이 보인다.
- 로그아웃하면 세션이 지워지고, 다시 `/admin` 에 들어가려면 로그인해야 한다.
- 투표자(Voter)는 지금처럼 로그인 없이 투표를 만들고 투표하고 결과를 본다. 기존 투표·마감 시각·결과 그래프 동작은 바뀌지 않는다.

목표 흐름: 투표 목록 → 운영자 로그인 → 운영자 대시보드 → 투표 목록(로그인 유지).

## User Stories

### 운영자 로그인 (`/`, `/admin/login`)

1. As a 운영자, I want 투표 목록에서 "운영자 로그인" 링크를 보기를, so that 로그인 화면을 찾아갈 수 있다
2. As a 운영자, I want `/admin/login` 에서 비밀번호를 입력해 로그인하기를, so that 운영자 화면에 들어갈 수 있다
3. As a 운영자, I want 로그인에 성공하면 바로 운영자 대시보드로 이동하기를, so that 한 번 더 클릭하지 않아도 된다
4. As a 운영자, I want 비밀번호가 틀리면 "비밀번호가 올바르지 않습니다." 안내를 보기를, so that 다시 입력할 수 있다
5. As a 운영자, I want 비밀번호를 비워 두고 제출하면 화면에서 먼저 막히기를, so that 불필요한 요청을 보내지 않는다
6. As a 운영자, I want 이미 로그인한 상태로 `/admin/login` 에 들어가면 대시보드로 이동하기를, so that 로그인 폼을 다시 볼 필요가 없다

### 로그인 유지 / 경로 보호

7. As a 운영자, I want 대시보드에서 투표 목록으로 돌아가도 로그인이 유지되기를, so that 목록과 대시보드를 오가며 볼 수 있다
8. As a 운영자, I want 로그인한 상태의 투표 목록에서 "운영자 로그인" 대신 "운영자 대시보드" 링크와 "로그아웃" 버튼을 보기를, so that 로그인 상태를 알고 바로 대시보드로 갈 수 있다
9. As a 운영자, I want 브라우저를 새로고침해도 로그인이 유지되기를, so that 매번 다시 로그인하지 않는다
10. As a 운영자, I want 로그인 후 일정 시간(8시간)이 지나면 세션이 만료되기를, so that 공용 컴퓨터에 로그인이 무기한 남지 않는다
11. As a 로그인하지 않은 사람, I want `/admin` 에 직접 들어가면 `/admin/login` 으로 이동되기를, so that 운영자 화면이 노출되지 않는다
12. As a 운영자, I want 쿠키를 조작하거나 위조해도 로그인한 것으로 인정되지 않기를, so that 비밀번호 없이 운영자 화면에 들어갈 수 없다

### 운영자 대시보드 (`/admin`, 읽기 전용)

13. As a 운영자, I want 대시보드에서 모든 투표를 최신순으로 보기를, so that 전체 현황을 한눈에 본다
14. As a 운영자, I want 투표마다 질문, 만든 시각(KST), 마감 상태, 총 투표수를 보기를, so that 어떤 투표가 진행 중이고 참여가 얼마나 되는지 안다
15. As a 운영자, I want 마감 상태가 "마감 없음", "진행 중 · 마감: YYYY-MM-DD HH:mm (KST)", "마감됨" 중 하나로 보이기를, so that 마감 여부를 바로 구분한다
16. As a 운영자, I want 투표마다 투표 화면과 결과 화면으로 가는 링크를 쓰기를, so that 자세한 내용을 바로 확인한다
17. As a 운영자, I want 투표가 하나도 없으면 "아직 투표가 없습니다" 를 보기를, so that 오류 없이 현재 상태를 안다
18. As a 운영자, I want 대시보드에서 "투표 목록으로" 링크를 쓰기를, so that 목록으로 돌아갈 수 있다
19. As a 운영자, I want 대시보드에 삭제·수정 버튼이 없기를, so that 실수로 투표를 바꾸지 않는다

### 로그아웃

20. As a 운영자, I want 대시보드와 로그인 상태의 투표 목록에서 "로그아웃" 버튼을 쓰기를, so that 작업이 끝나면 세션을 끝낼 수 있다
21. As a 운영자, I want 로그아웃하면 투표 목록으로 이동하고 다시 "운영자 로그인" 링크가 보이기를, so that 로그아웃됐음을 안다
22. As a 로그아웃한 사람, I want `/admin` 에 들어가면 다시 로그인 화면으로 이동되기를, so that 로그아웃이 실제로 적용됐음을 믿을 수 있다

### 투표자 (기존 기능 유지)

23. As a 투표자, I want 지금처럼 로그인 없이 투표를 만들고, 투표하고, 결과를 보기를, so that 운영자 기능 추가 때문에 불편해지지 않는다
24. As a 투표자, I want 마감 시각과 결과 그래프가 지금과 똑같이 동작하기를, so that 기존 투표가 문제없이 쓰인다

### API 사용자

25. As an API 사용자, I want `POST /api/admin/login` 에 `{ password }` 를 보내 맞으면 `200` 과 세션 쿠키를 받기를, so that 로그인할 수 있다
26. As an API 사용자, I want 틀린 비밀번호는 `401`, 잘못된 요청 형식은 `400` 과 `{ error }` 를 받기를, so that 실패 이유를 구분한다
27. As an API 사용자, I want `POST /api/admin/logout` 이 세션 쿠키를 지우고 `200` 을 돌려주기를, so that 로그아웃할 수 있다
28. As an API 사용자, I want 기존 `/api/polls/**` 가 인증 없이 지금과 같은 계약으로 동작하기를, so that 기존 클라이언트가 깨지지 않는다

## Implementation Decisions

### 기존 결정과의 관계

- ADR-0001 의 "운영자 인증을 구현하지 않는다" 부분을 **이 스펙이 바꾼다** (새 ADR-0003 으로 기록). 투표자 익명 참여와 중복 투표 방지 없음은 **그대로 유지**한다.
- 기본 앱 스펙(`.scratch/voting-app-mvp/spec.md`)과 부록 스펙(`.scratch/poll-deadline-and-chart/spec.md`)의 "Admin 로그인·세션·`proxy.ts` 가드는 범위 밖" 결정을 이 스펙이 바꾼다. 쿠키 기반 중복 투표 차단, 복수 선택, 결과 공개 조건, 결과 폴링, 투표 삭제, `votes` 테이블은 계속 범위 밖이다.
- 그 밖의 결정(입력 검증 규칙, 오류 형식, 마감 판정, KST 표시(ADR-0002), 결과 계산, 테스트 원칙)은 그대로 유지한다.

### 용어

- 화면에 보이는 모든 문구는 **"운영자"** 로 통일한다 ("운영자 로그인", "운영자 대시보드"). "관리자"는 화면에 쓰지 않는다.
- 코드 내부 이름(경로, 파일, 함수, 쿠키, 환경변수)은 `admin` 을 쓴다. 예: `/admin`, `/api/admin/login`, `admin_session`, `ADMIN_TOKEN`.

### 환경변수

- 운영자 인증에는 수업 자료와 같은 **`ADMIN_TOKEN`** 하나만 쓴다. 값은 `Artificial` 이다 (대소문자 구분). `ADMIN_PASSWORD` 로 이름을 바꾸지 않고, 별도의 `SESSION_SECRET` 도 추가하지 않는다.
- `ADMIN_TOKEN` 은 두 가지로 쓰인다: (1) 로그인 비밀번호 비교 대상, (2) 세션 쿠키 서명 키.
- `.env.local` 은 커밋하지 않는다(`.gitignore` 의 `.env*`). 구현 에이전트는 `.env.local` 을 직접 수정하지 않고, 사용자에게 `ADMIN_TOKEN=Artificial` 을 추가해 달라고 요청한다. 배포 시 Vercel 환경변수에도 같은 값을 등록한다.
- `ADMIN_TOKEN` 이 설정되지 않았으면 어떤 비밀번호로도 로그인되지 않고, 모든 세션을 무효로 본다. 로그인 API 는 이 경우 `500` 과 `{ error }` 를 돌려주고 서버 로그에 원인을 남긴다.

### 세션 (DB 없는 서명 쿠키)

- 세션은 DB 에 저장하지 않는다. 스키마(`db/schema.sql`)는 바꾸지 않는다.
- **admin 세션 모듈** (Next.js 에 의존하지 않는 순수 함수, `node:crypto` 사용):
  - 토큰 만들기: 만료 시각(현재 + 8시간, epoch ms)을 페이로드로, `ADMIN_TOKEN` 을 키로 한 HMAC-SHA256 서명을 붙여 `<만료시각>.<서명>` 문자열을 만든다. 쿠키에 `ADMIN_TOKEN` 원문을 넣지 않는다.
  - 토큰 확인: 형식, 서명(상수 시간 비교), 만료(`현재 시각 < 만료 시각`)를 모두 확인한다. 하나라도 틀리면 무효. 토큰이 없어도 무효.
  - 비밀번호 확인: 입력값과 `ADMIN_TOKEN` 을 상수 시간으로 비교한다 (길이가 달라도 예외 없이 `false`).
  - 현재 시각은 인자로 받아 테스트에서 고정할 수 있게 한다.
  - `ADMIN_TOKEN` 을 바꾸면 기존 세션은 모두 무효가 된다.
- **쿠키**: 이름 `admin_session`, `httpOnly`, `sameSite: "lax"`, `secure` (운영 환경에서만), `path: "/"`, `maxAge` 8시간. `path: "/"` 이므로 투표 목록에서도 로그인 상태를 읽을 수 있다.
- **서버 전용 헬퍼**: `await cookies()` (Next.js 16 에서 비동기)로 `admin_session` 을 읽어 토큰 확인 결과(로그인 여부)를 돌려준다. 페이지(`/`, `/admin`)가 이 헬퍼를 쓴다.

### 경로 보호 (`proxy.ts`, Next.js 16.3.6)

- 프로젝트 루트(`app/` 과 같은 위치)에 `proxy.ts` 를 만든다. Next.js 16 에서 `middleware.ts` 는 deprecated 이고 `proxy.ts` 가 그 역할을 한다. `proxy` 이름의 함수를 export 한다.
- `config.matcher` 는 상수 `["/admin/:path*"]` 로 한다 (`/admin` 자체도 포함). 그 밖의 경로(`/`, `/new`, `/polls/**`, `/api/**`, 정적 파일)에서는 Proxy 가 실행되지 않는다.
- 동작:
  - `/admin/login`: 로그인 상태면 `/admin` 으로 redirect, 아니면 통과.
  - 그 밖의 `/admin/**`: 로그인 상태가 아니면 `/admin/login` 으로 redirect, 맞으면 통과.
- Proxy 는 쿠키만 읽는 낙관적 검사다(DB 조회 없음). Proxy 는 기본 Node.js 런타임에서 돌기 때문에 세션 모듈의 `node:crypto` 를 그대로 쓴다. `runtime` 설정은 넣지 않는다 (넣으면 오류).
- **이중 확인**: `/admin` 페이지(서버 컴포넌트)도 서버 헬퍼로 로그인 여부를 다시 확인하고, 아니면 `redirect("/admin/login")` 한다. Proxy 의 matcher 가 바뀌어도 대시보드가 노출되지 않게 하기 위해서다.
- `/api/admin/login`, `/api/admin/logout` 은 matcher 밖이다 (로그인 전에 호출해야 하므로). 이후 운영자 전용 API 를 추가하면 그 Route Handler 안에서 직접 세션을 확인해야 한다 (이 스펙에는 없음).

### API 계약 (신규)

기존 방식을 따른다: Route Handler, `withErrorResponse` 로 감싸기, 오류는 `{ error: "<한국어 안내 문구>" }`, 응답 타입은 기존 API 타입 모듈에 추가.

- `POST /api/admin/login`
  - 요청: `{ password: string }`
  - 성공: `200`, `{ ok: true }`, `Set-Cookie: admin_session=...` (위 쿠키 옵션).
  - 요청 본문이 JSON 객체가 아니거나 `password` 가 문자열이 아님: `400`, `{ error: "요청 형식이 올바르지 않습니다." }`.
  - 비밀번호 불일치(빈 문자열 포함): `401`, `{ error: "비밀번호가 올바르지 않습니다." }`. 쿠키를 설정하지 않는다.
  - `ADMIN_TOKEN` 미설정: `500`, `{ error }`.
- `POST /api/admin/logout`
  - 성공: `200`, `{ ok: true }`, `admin_session` 쿠키 삭제 (`maxAge: 0`, 같은 `path`). 로그인하지 않은 상태에서 호출해도 `200`.
- 기존 `/api/polls`, `/api/polls/[id]`, `/api/polls/[id]/vote` 는 바꾸지 않는다. 인증 검사를 넣지 않는다.

### polls 데이터 접근 모듈 (추가만)

- 대시보드용 목록 조회 함수를 **새로 추가**한다: 모든 투표의 `id`, `question`, `created_at`, `closes_at`, 총 투표수(`sum(vote_count)`, 선택지가 없거나 0표면 0)를 만든 시각 최신순으로 돌려준다. 시각은 ISO 문자열로 바꿔 돌려준다 (기존 상세 조회와 같은 방식).
- 기존 함수(목록 조회, 상세 조회, 투표 생성, 득표 1 증가)의 시그니처와 SQL 은 바꾸지 않는다.
- 테스트용 메모리 가짜 모듈에도 같은 함수를 추가한다.

### 화면

- **`/` (투표 목록)**: 서버 헬퍼로 로그인 여부를 읽어 헤더 영역에 표시한다. 이 페이지는 이미 `await connection()` 으로 요청마다 렌더링되므로 렌더링 방식이 바뀌지 않는다.
  - 로그아웃 상태: "운영자 로그인" 링크(`/admin/login`).
  - 로그인 상태: "운영자 대시보드" 링크(`/admin`)와 "로그아웃" 버튼.
  - 투표 목록, "투표 만들기" 버튼, 빈 상태는 그대로 둔다.
  - 공통 레이아웃(`app/layout.tsx`)에서는 쿠키를 읽지 않는다 (모든 페이지에 영향을 주지 않기 위해).
- **`/admin/login`**: 제목 "운영자 로그인", 비밀번호 입력(`type="password"`) 하나와 "로그인" 버튼. 비어 있으면 화면에서 막고 안내한다. 제출하면 `POST /api/admin/login`, 성공하면 `/admin` 으로 이동(이동 후 최신 로그인 상태가 보이도록 새로 렌더링), 실패하면 응답의 `error` 문구를 그대로 보여준다. "투표 목록으로" 링크를 둔다.
- **`/admin` (운영자 대시보드, 읽기 전용)**: 제목 "운영자 대시보드". 서버 컴포넌트로 요청마다 최신 값을 보여준다.
  - 투표마다: 질문, 만든 시각 `YYYY-MM-DD HH:mm (KST)`, 마감 상태, `총 N표`, "투표 화면" 링크(`/polls/[id]`), "결과 보기" 링크(`/polls/[id]/results`).
  - 마감 상태: 마감 시각 없음 → "마감 없음"; 마감 전 → "진행 중 · 마감: YYYY-MM-DD HH:mm (KST)"; 마감 후 → "마감됨". 판정은 기존 마감 판정 함수를, 시각 표시는 기존 KST 표시 함수를 그대로 쓴다.
  - 투표가 없으면 "아직 투표가 없습니다".
  - "투표 목록으로" 링크(`/`)와 "로그아웃" 버튼.
  - 삭제·수정·마감 조작 버튼은 두지 않는다.
- **로그아웃 버튼** (클라이언트 컴포넌트, 목록과 대시보드에서 공용): `POST /api/admin/logout` 후 `/` 로 이동하고 새로 렌더링해 "운영자 로그인" 링크가 보이게 한다.
- 스타일은 기존 Tailwind 색 체계와 다크 모드를 따른다.

## Testing Decisions

- **좋은 테스트의 기준**: 기존과 같다. 외부에서 관찰 가능한 동작(HTTP 상태 코드, JSON 본문, `Set-Cookie`, redirect 위치, 순수 함수의 입력→출력)만 검증하고 SQL 이나 내부 구현을 검증하지 않는다.
- **테스트 경계**:
  1. **Route Handler** (기존 경계): `POST /api/admin/login`, `POST /api/admin/logout`. `ADMIN_TOKEN` 은 `vi.stubEnv` 로 설정한다.
  2. **순수 함수**: admin 세션 모듈 (토큰 만들기·확인, 비밀번호 확인). 현재 시각은 인자로 고정한다.
  3. **Proxy 함수**: `proxy.ts` 의 `proxy` 에 `NextRequest` 를 넘기고 redirect 여부와 위치를 검증한다.
- **테스트할 것**:
  - 로그인: 맞는 비밀번호 → `200` + `{ ok: true }` + `admin_session` 쿠키(`HttpOnly`, `Path=/`)이고 그 값이 토큰 확인을 통과; 틀린 비밀번호·빈 문자열·대소문자만 다름(`artificial`) → `401` + 쿠키 없음; 잘못된 JSON·`password` 누락·문자열 아님 → `400`; `ADMIN_TOKEN` 미설정 → `500`.
  - 로그아웃: `200` + `{ ok: true }` + `admin_session` 삭제 쿠키(`Max-Age=0`).
  - 세션 모듈: 만든 토큰은 만료 전 유효; 만료 시각 정각과 이후 무효; 서명 변조·페이로드 변조·형식 오류·빈 값·`undefined` 무효; 다른 `ADMIN_TOKEN` 으로 만든 토큰 무효.
  - Proxy: 쿠키 없이 `/admin` → `/admin/login` redirect; 유효 쿠키로 `/admin` → 통과; 만료·위조 쿠키로 `/admin` → redirect; 쿠키 없이 `/admin/login` → 통과; 유효 쿠키로 `/admin/login` → `/admin` redirect.
- **자동 테스트하지 않는 것**: 대시보드 목록의 실제 SQL, UI 렌더링(목록의 링크 전환, 로그인 폼, 대시보드 표시, 로그아웃 버튼) — `npm run dev` 로 직접 확인. 컴포넌트 테스트, Testing Library, jsdom, E2E 는 추가하지 않는다.
- **기존 테스트(prior art)**: `app/api/polls/**/route.test.ts`, `lib/*.test.ts`, `test/fake-polls.ts`. 기존 테스트는 수정 없이 모두 통과해야 한다 (가짜 모듈에 함수를 추가하는 것은 허용).

## Out of Scope

- 투표 삭제·수정, 마감 시각 수정, 수동 마감, 다시 열기 등 대시보드의 모든 쓰기 기능.
- 운영자 계정 여러 개, 아이디, 역할(권한 등급), 비밀번호 변경·재설정.
- DB 기반 세션, 세션 목록·강제 만료, 로그인 시도 횟수 제한.
- 운영자만 투표를 만들 수 있게 하는 등 기존 투표 기능에 대한 권한 제한.
- 투표자 로그인, 쿠키 기반 중복 투표 차단, 복수 선택, 결과 공개 조건, 결과 폴링, `votes` 테이블.
- 공통 헤더(`app/layout.tsx`)에 로그인 상태 표시.

## Further Notes

- 기준 자료: 수업 영상의 관리자 흐름 (투표 목록 → 로그인 → 대시보드 → 투표 목록, 로그인 유지). 이 스펙의 결정은 사용자가 확정했다: 화면 용어 "운영자" 통일, 대시보드 읽기 전용, 로그아웃 포함, 환경변수 `ADMIN_TOKEN=Artificial` (이름 변경 금지).
- 비밀번호 값은 대소문자를 구분한다. 이전 대화에서 언급된 소문자 `artificial` 이 아니라 `ADMIN_TOKEN` 값인 `Artificial` 이 기준이다.
- 세션 만료 8시간과 쿠키 이름 `admin_session` 은 스펙 작성 시 정한 기본값이다.
- 관련 문서: `CONTEXT.md`, `docs/adr/0001-anonymous-voting-no-duplicate-prevention.md`, `docs/adr/0002-closing-time-in-kst.md`, `.scratch/voting-app-mvp/spec.md`, `.scratch/poll-deadline-and-chart/spec.md`, `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`, `node_modules/next/dist/docs/01-app/02-guides/authentication.md`.
- 티켓 분할: ① 로그인 + 세션 + Proxy 보호 + 목록 링크, ② 읽기 전용 대시보드 내용, ③ 로그아웃, ④ 문서 갱신.
