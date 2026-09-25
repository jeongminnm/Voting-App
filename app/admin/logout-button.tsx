"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApiError } from "@/lib/api";

export function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogout() {
    if (submitting) return;

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });
      if (!res.ok) {
        const { error } = (await res.json()) as ApiError;
        setError(error);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("요청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleLogout}
        disabled={submitting}
        className="text-sm font-medium underline disabled:opacity-50"
      >
        {submitting ? "로그아웃 중..." : "로그아웃"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
