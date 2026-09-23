"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApiError, CreatePollResponse } from "@/lib/api";
import { kstLocalToIso } from "@/lib/kst";
import {
  MAX_OPTION_LENGTH,
  MAX_OPTIONS,
  MAX_QUESTION_LENGTH,
  MIN_OPTIONS,
  validatePollInput,
} from "@/lib/validation";

type OptionField = { key: number; value: string };

export function PollForm() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<OptionField[]>([
    { key: 0, value: "" },
    { key: 1, value: "" },
  ]);
  const [nextKey, setNextKey] = useState(MIN_OPTIONS);
  // datetime-local 값("YYYY-MM-DDTHH:mm"). 비어 있으면 마감 없음.
  const [closesAtLocal, setClosesAtLocal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function addOption() {
    if (options.length >= MAX_OPTIONS) return;
    setOptions([...options, { key: nextKey, value: "" }]);
    setNextKey(nextKey + 1);
  }

  function removeOption(key: number) {
    setOptions(options.filter((o) => o.key !== key));
  }

  function changeOption(key: number, value: string) {
    setOptions(options.map((o) => (o.key === key ? { ...o, value } : o)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // 입력한 날짜·시간은 브라우저 시간대와 상관없이 KST 로 해석한다 (ADR-0002).
    const closesAt = closesAtLocal === "" ? null : kstLocalToIso(closesAtLocal);
    const result = validatePollInput({ question, options: options.map((o) => o.value), closesAt });
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: result.value.question, options: result.value.options, closesAt }),
      });
      if (!res.ok) {
        const { error } = (await res.json()) as ApiError;
        setError(error);
        return;
      }
      const { id } = (await res.json()) as CreatePollResponse;
      router.push(`/polls/${id}`);
    } catch {
      setError("요청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <label className="flex flex-col gap-2">
        <span className="font-medium">질문</span>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={MAX_QUESTION_LENGTH}
          placeholder="예: 이번 회식 메뉴는?"
          className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-medium">
          선택지 ({MIN_OPTIONS}~{MAX_OPTIONS}개)
        </legend>
        {options.map((option, index) => (
          <div key={option.key} className="flex items-center gap-2">
            <input
              type="text"
              value={option.value}
              onChange={(e) => changeOption(option.key, e.target.value)}
              maxLength={MAX_OPTION_LENGTH}
              placeholder={`선택지 ${index + 1}`}
              aria-label={`선택지 ${index + 1}`}
              className="flex-1 rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
            {index >= MIN_OPTIONS && (
              <button
                type="button"
                onClick={() => removeOption(option.key)}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
              >
                삭제
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addOption}
          disabled={options.length >= MAX_OPTIONS}
          className="self-start rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-40 dark:border-zinc-700"
        >
          선택지 추가
        </button>
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className="font-medium">
          마감 시간 <span className="text-sm font-normal text-zinc-500">(선택, 한국 시간 기준)</span>
        </span>
        <input
          type="datetime-local"
          value={closesAtLocal}
          onChange={(e) => setClosesAtLocal(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <span className="text-sm text-zinc-500">비워 두면 마감 없이 계속 진행됩니다.</span>
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-50"
      >
        {submitting ? "만드는 중..." : "투표 만들기"}
      </button>
    </form>
  );
}
