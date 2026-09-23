// 모든 API 오류 응답은 { error: "<한국어 안내 문구>" } 형식으로 통일한다.
export function errorResponse(status: number, message: string) {
  return Response.json({ error: message }, { status });
}
