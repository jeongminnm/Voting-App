# 03: 운영자 로그아웃

**What to build:** 로그인한 운영자가 운영자 대시보드(`/admin`)와 투표 목록(`/`)에서 "로그아웃" 버튼을 누르면 `admin_session` 쿠키가 지워지고 투표 목록으로 이동한다. 이동한 목록에는 다시 "운영자 로그인" 링크가 보이고, `/admin` 에 들어가면 `/admin/login` 으로 이동된다.

스펙: `.scratch/admin-login/spec.md` (User Stories 8, 20–22, 27)

**Blocked by:** 01 (운영자 로그인 + 서명 쿠키 세션 + `proxy.ts` 경로 보호)

**Status:** ready-for-agent

### API

- [ ] `POST /api/admin/logout` — `200` + `{ ok: true }` 를 돌려주고 `admin_session` 쿠키를 삭제한다 (`maxAge: 0`, 로그인 때와 같은 `path: "/"`).
- [ ] 로그인하지 않은 상태에서 호출해도 `200` 이다.
- [ ] 기존처럼 `withErrorResponse` 로 감싸고, 응답 타입을 기존 API 타입 모듈에 추가한다 (01 의 `{ ok: true }` 타입을 같이 써도 된다).

### 화면

- [ ] 로그아웃 버튼 클라이언트 컴포넌트: `POST /api/admin/logout` 후 `/` 로 이동하고 새로 렌더링해서 "운영자 로그인" 링크가 보이게 한다. 요청이 실패하면 응답의 `error` 문구를 보여준다.
- [ ] `/admin` 에 "로그아웃" 버튼을 둔다.
- [ ] `/` 에서 로그인 상태일 때 "운영자 대시보드" 링크 옆에 "로그아웃" 버튼을 둔다. 로그아웃 상태면 버튼이 없다.

### 테스트

- [ ] 로그아웃 Route Handler: `200` + `{ ok: true }` + `admin_session` 삭제 쿠키(`Max-Age=0`, `Path=/`).
- [ ] 쿠키 없이 호출해도 `200`.
- [ ] 기존 테스트를 포함해 `npm run test`, `npm run typecheck`, `npm run lint` 가 모두 통과한다.

### 수동 확인 (`npm run dev`)

- [ ] 대시보드에서 로그아웃하면 `/` 로 이동하고 "운영자 로그인" 링크가 보인다.
- [ ] 로그인 상태의 `/` 에서 로그아웃해도 같다.
- [ ] 로그아웃 후 `/admin` 에 들어가면 `/admin/login` 으로 이동한다.
- [ ] 브라우저 개발자 도구에서 `admin_session` 쿠키가 사라졌다.
