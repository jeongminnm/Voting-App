// 투표 입력 검증. /new 화면과 POST /api/polls 가 같은 함수를 써서 규칙이 어긋나지 않게 한다.
import type { NewPoll } from "@/lib/polls";

export const MAX_QUESTION_LENGTH = 200;
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 5;
export const MAX_OPTION_LENGTH = 100;

export type ValidationResult = { ok: true; value: NewPoll } | { ok: false; error: string };

export function validatePollInput(input: { question?: unknown; options?: unknown }): ValidationResult {
  const question = typeof input.question === "string" ? input.question.trim() : "";
  if (question === "") return { ok: false, error: "질문을 입력해 주세요." };
  if (question.length > MAX_QUESTION_LENGTH) {
    return { ok: false, error: `질문은 ${MAX_QUESTION_LENGTH}자 이하로 입력해 주세요.` };
  }

  if (!Array.isArray(input.options) || input.options.length < MIN_OPTIONS || input.options.length > MAX_OPTIONS) {
    return { ok: false, error: `선택지는 ${MIN_OPTIONS}개 이상 ${MAX_OPTIONS}개 이하로 입력해 주세요.` };
  }

  const options = input.options.map((o) => (typeof o === "string" ? o.trim() : ""));
  if (options.some((o) => o === "")) return { ok: false, error: "빈 선택지가 있습니다. 모든 선택지를 입력해 주세요." };
  if (options.some((o) => o.length > MAX_OPTION_LENGTH)) {
    return { ok: false, error: `선택지는 ${MAX_OPTION_LENGTH}자 이하로 입력해 주세요.` };
  }
  if (new Set(options).size !== options.length) return { ok: false, error: "같은 이름의 선택지가 있습니다." };

  return { ok: true, value: { question, options } };
}
