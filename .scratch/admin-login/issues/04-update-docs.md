# 04: 운영자 기능 문서 갱신 (ADR·CONTEXT·README·기존 스펙)

**What to build:** 운영자 로그인과 읽기 전용 대시보드가 생긴 사실을 기존 문서에 반영한다. ADR-0001 에서 "운영자 인증을 구현하지 않는다" 부분이 바뀌었음을 표시하고, 그 결정을 새 ADR-0003 으로 기록한다. `CONTEXT.md` 에 "운영자" 용어를 추가하고, README 와 기존 스펙의 "Admin 로그인은 범위 밖" 문구를 고친다. 투표자 익명 참여와 중복 투표 허용은 바뀌지 않았다는 점이 문서에 그대로 남아야 한다. 코드는 바꾸지 않는다.

스펙: `.scratch/admin-login/spec.md` (Implementation Decisions: 기존 결정과의 관계, 용어, 환경변수, 세션, 경로 보호)

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

### ADR

- [ ] `docs/adr/0001-anonymous-voting-no-duplicate-prevention.md`: 투표자 로그인 없음·중복 투표 방지 없음은 유지하고, "운영자 인증은 ADR-0003 으로 대체됨" 을 적는다. 기존 결정의 기록을 지우지 않는다.
- [ ] 새 `docs/adr/0003-admin-login-with-admin-token-cookie.md` (기존 ADR 형식): 단일 비밀번호 `ADMIN_TOKEN`(수업 자료와 같은 이름), DB 없는 HMAC 서명 쿠키 `admin_session` (8시간), `proxy.ts` 는 낙관적 검사이고 `/admin` 페이지가 다시 확인한다, 대시보드는 읽기 전용이다. 트레이드오프(계정 하나·비밀번호 공유, 로그인 시도 제한 없음, `ADMIN_TOKEN` 변경 시 모든 세션 무효)를 적는다.

### CONTEXT.md

- [ ] 용어 추가: **운영자 (Admin)** — `ADMIN_TOKEN` 비밀번호로 로그인해 운영자 대시보드에서 전체 투표 현황을 읽기 전용으로 보는 사람. 화면에는 "운영자" 를 쓰고 코드에는 `admin` 을 쓴다. _Avoid_: 관리자.
- [ ] 필요하면 **운영자 대시보드** 용어를 추가한다.
- [ ] 투표자(Voter) 항목의 "로그인 없이 익명으로 참여한다" 는 유지한다.

### README.md

- [ ] 기능 목록에 운영자 로그인·읽기 전용 운영자 대시보드·로그아웃을 추가한다.
- [ ] "로그인 없이" 문구가 투표자 기준임이 분명하도록 다듬는다.
- [ ] 실행 방법에 환경변수 `ADMIN_TOKEN` 을 추가한다 (로컬은 `.env.local`, 배포는 Vercel 환경변수). 비밀번호 값 자체를 README 에 적을지는 수업 자료 방식을 따르되, 적지 않는 것을 기본으로 한다.

### 기존 스펙

- [ ] `.scratch/voting-app-mvp/spec.md` 의 인증 절(146행 근처)과 Out of Scope(166행 근처): Admin 로그인·세션·`proxy.ts` 가드는 `.scratch/admin-login/spec.md` 에서 범위에 포함됐다는 메모를 붙인다. 나머지 범위 밖 항목은 그대로 둔다.
- [ ] `.scratch/poll-deadline-and-chart/spec.md` Out of Scope(157행 근처): 같은 메모를 붙인다.

### 확인

- [ ] 문서 어디에도 화면 용어로 "관리자" 를 쓰지 않는다 (코드 이름 `admin` 설명은 예외).
- [ ] 문서의 경로·환경변수·쿠키 이름이 구현(01–03)과 일치한다.
