// 투표 입력 검증. /new 화면과 POST /api/polls 가 같은 함수를 써서 규칙이 어긋나지 않게 한다.
import type { NewPoll } from "@/lib/polls";

export const MAX_QUESTION_LENGTH = 200;
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 5;
export const MAX_OPTION_LENGTH = 100;

export type ValidationResult = { ok: true; value: NewPoll } | { ok: false; error: string };

export function validatePollInput(input: { question?: unknown; options?: unknown; closesAt?: unknown }): ValidationResult {
  const question = typeof input.question === "string" ? input.question.trim() : "";
  if (question === "") return { ok: false, error: "질문을 입력해 주세요." };
  if (question.length > MAX_QUESTION_LENGTH) {
    return { ok: false, error: `질문은 ${MAX_QUESTION_LENGTH}자 이하로 입력해 주세요.` };
  }

  if (!Array.isArray(input.options) || input.options.length < MIN_OPTIONS || input.options.length > MAX_OPTIONS) {
    return { ok: false, error: `선택지는 ${MIN_OPTIONS}개 이상 ${MAX_OPTIONS}개 이하로 입력해 주세요.` };
  }

  // Array.isArray 는 any[] 로 좁히므로 unknown[] 으로 다시 받는다.
  const rawOptions: unknown[] = input.options;
  const options = rawOptions.map((o) => (typeof o === "string" ? o.trim() : ""));
  if (options.some((o) => o === "")) return { ok: false, error: "빈 선택지가 있습니다. 모든 선택지를 입력해 주세요." };
  if (options.some((o) => o.length > MAX_OPTION_LENGTH)) {
    return { ok: false, error: `선택지는 ${MAX_OPTION_LENGTH}자 이하로 입력해 주세요.` };
  }
  // 공백 정리 후 문자열이 완전히 같을 때만 중복이다 (대소문자 구분: Pizza 와 pizza 는 다른 선택지).
  if (new Set(options).size !== options.length) return { ok: false, error: "같은 이름의 선택지가 있습니다." };

  const closesAt = validateClosesAt(input.closesAt);
  if (!closesAt.ok) return closesAt;

  return { ok: true, value: { question, options, closesAt: closesAt.value } };
}

// 시간대(Z 또는 ±HH:MM)가 포함된 ISO 8601 날짜·시각. 시간대가 없으면 어느 나라 시각인지 모호하므로 거부한다.
const ISO_WITH_TIMEZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

// 마감 시각은 선택 입력이다. 생략·null 이면 마감 없음(null), 있으면 지금 이후의 절대 시각이어야 한다.
function validateClosesAt(value: unknown): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value === undefined || value === null) return { ok: true, value: null };

  const time = typeof value === "string" && ISO_WITH_TIMEZONE.test(value) ? Date.parse(value) : NaN;
  if (Number.isNaN(time)) return { ok: false, error: "마감 시각 형식이 올바르지 않습니다." };
  if (time <= Date.now()) return { ok: false, error: "마감 시각은 지금 이후로 입력해 주세요." };

  return { ok: true, value: new Date(time).toISOString() };
}
