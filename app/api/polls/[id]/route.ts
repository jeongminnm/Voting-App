import { errorResponse } from "@/lib/api";
import { getPoll } from "@/lib/polls";

export async function GET(_request: Request, ctx: RouteContext<"/api/polls/[id]">) {
  const { id } = await ctx.params;
  const poll = await getPoll(id);
  if (!poll) return errorResponse(404, "투표를 찾을 수 없습니다.");
  return Response.json(poll);
}
