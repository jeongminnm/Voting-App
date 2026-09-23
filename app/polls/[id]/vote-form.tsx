"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApiError } from "@/lib/api";
import type { PollOption } from "@/lib/polls";

export function VoteForm({ pollId, options }: { pollId: string; options: PollOption[] }) {
  const router = useRouter();
  const [optionId, setOptionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!optionId) {
      setError("선택지를 하나 골라 주세요.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      if (!res.ok) {
        const { error } = (await res.json()) as ApiError;
        setError(error);
        return;
      }
      router.push(`/polls/${pollId}/results`);
    } catch {
      setError("요청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">선택지</legend>
        {options.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-3 rounded-md border border-zinc-200 px-4 py-3 has-[:checked]:border-foreground dark:border-zinc-800"
          >
            <input
              type="radio"
              name="option"
              value={option.id}
              checked={optionId === option.id}
              onChange={() => setOptionId(option.id)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>

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
        {submitting ? "투표하는 중..." : "투표하기"}
      </button>
    </form>
  );
}
