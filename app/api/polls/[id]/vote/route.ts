import { errorResponse, readJsonObject, type VoteResponse, withErrorResponse } from "@/lib/api";
import { isClosed } from "@/lib/closing";
import { castVote, getPoll } from "@/lib/polls";

// 확인 순서: 없는 투표(404) → 마감(409) → 선택지 확인(400).
export const POST = withErrorResponse(async (request: Request, ctx: RouteContext<"/api/polls/[id]/vote">) => {
  const { id } = await ctx.params;
  const poll = await getPoll(id);
  if (!poll) return errorResponse(404, "투표를 찾을 수 없습니다.");
  if (isClosed(poll.closes_at)) return errorResponse(409, "마감된 투표입니다.");

  const body = await readJsonObject(request);
  const optionId = body?.optionId;
  if (typeof optionId !== "string") return errorResponse(400, "선택지를 골라 주세요.");

  if (!(await castVote(id, optionId))) return errorResponse(400, "이 투표에 없는 선택지입니다.");
  return Response.json({ ok: true } satisfies VoteResponse);
});
