import { type CreatePollResponse, errorResponse, readJsonObject, withErrorResponse } from "@/lib/api";
import { createPoll } from "@/lib/polls";
import { validatePollInput } from "@/lib/validation";

export const POST = withErrorResponse(async (request: Request) => {
  const body = await readJsonObject(request);
  if (!body) return errorResponse(400, "요청 형식이 올바르지 않습니다.");

  const result = validatePollInput(body);
  if (!result.ok) return errorResponse(400, result.error);

  const id = await createPoll(result.value);
  return Response.json({ id } satisfies CreatePollResponse, { status: 201 });
});
