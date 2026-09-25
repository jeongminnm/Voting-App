# 01: 운영자 로그인 + 서명 쿠키 세션 + `proxy.ts` 경로 보호

**What to build:** 투표 목록(`/`)에 "운영자 로그인" 링크가 생긴다. 운영자는 `/admin/login` 에서 비밀번호를 입력하고, 서버는 이를 환경변수 `ADMIN_TOKEN` 과 비교한다. 맞으면 `ADMIN_TOKEN` 으로 서명한 `admin_session` 쿠키(8시간)를 설정하고 `/admin` 으로 이동한다. 로그인하지 않은 사람이 `/admin` 에 들어가면 `proxy.ts` 가 `/admin/login` 으로 돌려보내고, `/admin` 페이지도 서버에서 한 번 더 확인한다. 로그인한 상태로 `/` 에 돌아오면 "운영자 로그인" 대신 "운영자 대시보드" 링크가 보인다. 이 티켓의 `/admin` 은 제목 "운영자 대시보드" 와 "투표 목록으로" 링크만 있는 빈 화면이다 (내용은 02, 로그아웃은 03). 기존 투표 기능은 바뀌지 않는다.

스펙: `.scratch/admin-login/spec.md` (User Stories 1–12, 18, 23–26, 28)

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

### 환경변수

- [x] 환경변수 이름은 `ADMIN_TOKEN` 이다. `ADMIN_PASSWORD` 로 바꾸지 않고 `SESSION_SECRET` 도 추가하지 않는다.
- [x] 구현 에이전트는 `.env.local` 을 직접 수정하지 않는다. 사용자에게 `ADMIN_TOKEN=Artificial` 을 추가하고 dev 서버를 다시 시작해 달라고 요청한 뒤 수동 확인을 진행한다.
- [x] `ADMIN_TOKEN` 이 없으면 모든 세션이 무효이고, 로그인 API 는 `500` 과 `{ error }` 를 돌려주며 서버 로그에 원인을 남긴다.

### admin 세션 모듈 (순수 함수, `node:crypto`)

- [x] 토큰 만들기: `<만료시각 epoch ms>.<HMAC-SHA256(만료시각, key=ADMIN_TOKEN)>`. 만료 = 현재 + 8시간. 쿠키에 `ADMIN_TOKEN` 원문을 넣지 않는다.
- [x] 토큰 확인: 형식·서명(상수 시간 비교)·만료(`현재 < 만료`)를 모두 확인한다. `undefined`·빈 값·형식 오류는 예외 없이 무효.
- [x] 비밀번호 확인: 입력값과 `ADMIN_TOKEN` 을 상수 시간으로 비교한다. 길이가 달라도 예외 없이 `false`. 대소문자를 구분한다.
- [x] 현재 시각을 인자로 받는다.

### 서버 헬퍼

- [x] `await cookies()` 로 `admin_session` 을 읽어 로그인 여부를 돌려주는 서버 전용 함수를 만든다.

### API

- [x] `POST /api/admin/login` — 요청 `{ password: string }`.
  - [x] 맞으면 `200` + `{ ok: true }` + `admin_session` 쿠키 (`httpOnly`, `sameSite: "lax"`, 운영 환경에서만 `secure`, `path: "/"`, `maxAge` 8시간).
  - [x] 본문이 JSON 객체가 아니거나 `password` 가 문자열이 아니면 `400` + `{ error: "요청 형식이 올바르지 않습니다." }`.
  - [x] 틀리면(빈 문자열 포함) `401` + `{ error: "비밀번호가 올바르지 않습니다." }`, 쿠키 없음.
  - [x] 기존처럼 `withErrorResponse` 로 감싸고, 응답 타입을 기존 API 타입 모듈에 추가한다.
- [x] 기존 `/api/polls/**` 는 수정하지 않는다.

### `proxy.ts` (Next.js 16.3.6)

- [x] 작성 전에 `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` 를 읽는다.
- [x] 프로젝트 루트(`app/` 과 같은 위치)에 `proxy.ts` 를 만들고 `proxy` 함수를 export 한다. `middleware.ts` 는 만들지 않는다. `runtime` 설정은 넣지 않는다.
- [x] `config.matcher` 는 상수 `["/admin/:path*"]`.
- [x] `/admin/login`: 로그인 상태면 `/admin` 으로 redirect, 아니면 통과.
- [x] 그 밖의 `/admin/**`: 로그인 상태가 아니면 `/admin/login` 으로 redirect.
- [x] 쿠키만 읽는다 (DB 조회 없음).

### 화면

- [x] `/`: 로그아웃 상태면 "운영자 로그인" 링크(`/admin/login`), 로그인 상태면 "운영자 대시보드" 링크(`/admin`). 목록·"투표 만들기"·빈 상태는 그대로 둔다. `app/layout.tsx` 에서는 쿠키를 읽지 않는다.
- [x] `/admin/login`: 제목 "운영자 로그인", `type="password"` 입력과 "로그인" 버튼, "투표 목록으로" 링크. 비어 있으면 화면에서 막고 안내한다. 성공하면 `/admin` 으로 이동하고 새로 렌더링한다. 실패하면 응답의 `error` 문구를 그대로 보여준다.
- [x] `/admin`: 제목 "운영자 대시보드" 와 "투표 목록으로" 링크. 서버 헬퍼로 다시 확인하고 아니면 `redirect("/admin/login")` 한다.
- [x] 화면에 "관리자" 라는 단어를 쓰지 않는다.

### 테스트

- [x] 세션 모듈: 만료 전 유효; 만료 정각·이후 무효; 서명 변조·페이로드 변조·형식 오류·빈 값·`undefined` 무효; 다른 `ADMIN_TOKEN` 으로 만든 토큰 무효.
- [x] 비밀번호 확인: `Artificial` → `true`; `artificial`, 빈 문자열, 다른 길이 → `false`.
- [x] 로그인 Route Handler (`vi.stubEnv("ADMIN_TOKEN", "Artificial")`): 성공 시 `200`·`{ ok: true }`·`HttpOnly`·`Path=/` 인 `admin_session` 이고 값이 토큰 확인을 통과; 틀림·빈 문자열·`artificial` → `401` + 쿠키 없음; 잘못된 JSON·`password` 누락·문자열 아님 → `400`; `ADMIN_TOKEN` 미설정 → `500`.
- [x] Proxy: 쿠키 없이 `/admin` → `/admin/login`; 유효 쿠키로 `/admin` → 통과; 만료·위조 쿠키로 `/admin` → `/admin/login`; 쿠키 없이 `/admin/login` → 통과; 유효 쿠키로 `/admin/login` → `/admin`.
- [x] 기존 테스트를 포함해 `npm run test`, `npm run typecheck`, `npm run lint` 가 모두 통과한다.

### 수동 확인 (`npm run dev`)

- [x] `/` 에 "운영자 로그인" 이 보이고, `/admin/login` 에서 `Artificial` 로 로그인하면 `/admin` 으로 이동한다.
- [x] 틀린 비밀번호는 "비밀번호가 올바르지 않습니다." 가 보인다.
- [x] `/admin` 에서 "투표 목록으로" 를 누르면 `/` 에 "운영자 대시보드" 링크가 보이고, 새로고침해도 유지된다.
- [x] 시크릿 창에서 `/admin` 에 들어가면 `/admin/login` 으로 이동한다.
- [x] 로그인 상태로 `/admin/login` 에 들어가면 `/admin` 으로 이동한다.
- [x] 로그인 여부와 관계없이 투표 만들기(마감 시간 포함), 투표, 마감된 투표 거부, 결과 그래프가 기존과 같다.
