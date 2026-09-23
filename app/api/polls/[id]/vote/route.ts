import { errorResponse } from "@/lib/api";
import { castVote, getPoll } from "@/lib/polls";

export async function POST(request: Request, ctx: RouteContext<"/api/polls/[id]/vote">) {
  const { id } = await ctx.params;
  if (!(await getPoll(id))) return errorResponse(404, "투표를 찾을 수 없습니다.");

  const body = await request.json().catch(() => null);
  const optionId = typeof body === "object" && body !== null ? body.optionId : undefined;
  if (typeof optionId !== "string") return errorResponse(400, "선택지를 골라 주세요.");

  if (!(await castVote(id, optionId))) return errorResponse(400, "이 투표에 없는 선택지입니다.");
  return Response.json({ ok: true });
}
