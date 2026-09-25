"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApiError } from "@/lib/api";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get("password");
    if (typeof password !== "string" || password === "") {
      setError("비밀번호를 입력해 주세요.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const { error } = (await res.json()) as ApiError;
        setError(error);
        return;
      }
      // 새 세션 쿠키로 서버 컴포넌트를 다시 렌더링해 로그인 상태가 바로 보이게 한다.
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("요청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <label className="flex flex-col gap-2">
        <span className="font-medium">비밀번호</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
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
        {submitting ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}
