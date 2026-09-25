// 모든 API 오류 응답은 { error: "<한국어 안내 문구>" } 형식으로 통일한다.
export type ApiError = { error: string };

// POST /api/polls 성공 응답
export type CreatePollResponse = { id: string };

// POST /api/polls/[id]/vote 성공 응답
export type VoteResponse = { ok: true };

// POST /api/admin/login 성공 응답
export type AdminLoginResponse = { ok: true };

export function errorResponse(status: number, message: string) {
  return Response.json({ error: message } satisfies ApiError, { status });
}

// 요청 본문이 JSON 객체면 그 객체를, 아니면(잘못된 JSON, null, 배열 등) null 을 돌려준다.
export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  return body as Record<string, unknown>;
}

// Route Handler 에서 예외(DB 오류 등)가 나도 500 과 { error } 형식으로 응답하게 감싼다.
export function withErrorResponse<Args extends unknown[]>(handler: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error(error);
      return errorResponse(500, "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };
}
