import { errorResponse, withErrorResponse } from "@/lib/api";
import { getPoll, type Poll } from "@/lib/polls";

export const GET = withErrorResponse(async (_request: Request, ctx: RouteContext<"/api/polls/[id]">) => {
  const { id } = await ctx.params;
  const poll = await getPoll(id);
  if (!poll) return errorResponse(404, "투표를 찾을 수 없습니다.");
  return Response.json(poll satisfies Poll);
});
