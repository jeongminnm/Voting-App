import { errorResponse } from "@/lib/api";
import { createPoll } from "@/lib/polls";
import { validatePollInput } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) return errorResponse(400, "요청 형식이 올바르지 않습니다.");

  const result = validatePollInput(body);
  if (!result.ok) return errorResponse(400, result.error);

  const id = await createPoll(result.value);
  return Response.json({ id }, { status: 201 });
}
