# 투표 앱 (Voting App)

질문 하나와 선택지를 올리면 누구나 로그인 없이 하나를 골라 투표하고, 결과를 막대그래프로 확인하는 동아리용 웹 투표 앱입니다.

제작자: 임정민

## 주요 기능

- **투표 생성**: 질문 하나와 선택지로 투표를 만듭니다. 질문은 200자, 선택지는 100자까지이고, 빈 값과 같은 투표 안의 중복 선택지는 거부합니다.
- **익명 투표**: 로그인 없이 누구나 투표를 만들고 참여합니다. 선택지 하나만 고를 수 있습니다. 중복 투표는 막지 않습니다 ([ADR-0001](docs/adr/0001-anonymous-voting-no-duplicate-prevention.md)).
- **선택지 2~5개**: 처음에 입력칸 2개로 시작하고 "선택지 추가"로 5개까지 늘릴 수 있습니다.
- **투표 마감 시간 설정**: 투표를 만들 때 마감 시간을 선택적으로 정합니다. 비워 두면 마감 없이 계속 진행됩니다. 마감 시간은 항상 한국 시간(KST) 기준으로 입력·표시합니다 ([ADR-0002](docs/adr/0002-closing-time-in-kst.md)).
- **마감 후 투표 차단**: 마감 시각이 지나면 투표 화면에 "마감된 투표입니다"가 표시되고 선택지와 투표 버튼이 비활성화됩니다. 서버도 마감된 투표에 대한 요청을 `409`로 거부합니다.
- **결과 가로 막대 그래프**: 결과 화면에 총 투표수와 선택지별 가로 막대, `N표 (xx%)`를 득표수가 많은 순으로 보여줍니다. 아직 투표가 없으면 "아직 아무도 투표하지 않았습니다."를 표시합니다.
- **제작자 이름 표시**: 모든 페이지 상단 Header에 `투표 앱 · 제작자: 임정민`을 표시합니다.

## 사용 기술

- [Next.js](https://nextjs.org) 16 (App Router, Route Handlers)
- TypeScript
- [Neon](https://neon.com) Postgres (`@neondatabase/serverless`, ORM 없이 SQL 직접 작성)
- Tailwind CSS 4
- [Vitest](https://vitest.dev) 4

## 실행 방법

1. 의존성을 설치합니다.

   ```bash
   npm install
   ```

2. 프로젝트 루트에 `.env.local` 파일을 만들고 Neon 연결 문자열을 넣습니다. 이 파일은 `.gitignore`에 포함되어 저장소에 올라가지 않습니다.

   ```
   DATABASE_URL=postgresql://<Neon 연결 문자열>
   ```

3. Neon 콘솔의 SQL Editor에서 [`db/schema.sql`](db/schema.sql)을 실행합니다. `polls`, `options` 테이블을 만들고 마감 시각 컬럼(`closes_at`)을 추가합니다.

   - 새 DB라면 파일 전체를 한 번 실행하면 됩니다.
   - 이미 두 테이블을 만든 DB라면 마지막 줄 `alter table polls add column closes_at timestamptz;`만 실행합니다.

4. 개발 서버를 실행하고 <http://localhost:3000> 에 접속합니다.

   ```bash
   npm run dev
   ```

## 테스트 방법

```bash
npm run test
```

Vitest로 API(Route Handler)와 결과 계산·KST 변환 순수 함수를 테스트합니다. 테스트는 DB 대신 메모리 기반 가짜 모듈을 쓰므로 `DATABASE_URL` 없이 실행됩니다.

## 주요 페이지

| 경로 | 내용 |
|---|---|
| `/` | 전체 투표 목록 (최신순). "투표 만들기" 링크 |
| `/new` | 투표 만들기: 질문, 선택지 2~5개, 마감 시간(선택) |
| `/polls/[id]` | 투표하기: 선택지 하나를 골라 제출, 마감 시각 표시, "결과 보기" 링크 |
| `/polls/[id]/results` | 결과 보기: 총 투표수와 선택지별 가로 막대 그래프, 마감 여부 표시 |
