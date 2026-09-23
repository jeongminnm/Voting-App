import type { ResultRow } from "@/lib/results";

// 선택지 한 줄의 결과 막대. 계산은 calculateResults 가 하고, 이 컴포넌트는 그리기만 한다.
// 막대 길이는 반올림 전 정확한 비율(ratio)을 쓰고, 모든 막대는 같은 색이다.
export function ResultBar({ row }: { row: ResultRow }) {
  return (
    <li className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <span>{row.label}</span>
        <span className="shrink-0 font-medium tabular-nums">
          {row.vote_count}표 ({row.percent}%)
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800" aria-hidden="true">
        <div className="h-full rounded-full bg-foreground" style={{ width: `${row.ratio * 100}%` }} />
      </div>
    </li>
  );
}
