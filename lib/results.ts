// 결과 화면(막대그래프)에 보여줄 값을 계산하는 순수 함수.
import type { PollOption } from "@/lib/polls";

export type ResultRow = {
  id: string;
  label: string;
  vote_count: number;
  // 표시용 정수 퍼센트: Math.round(득표수 / 총 투표수 × 100). 합계를 100 으로 보정하지 않는다.
  percent: number;
  // 막대 길이용 정확한 비율(0~1). 반올림하지 않는다.
  ratio: number;
};

export type PollResults = {
  total: number;
  rows: ResultRow[];
};

export function calculateResults(options: PollOption[]): PollResults {
  const total = options.reduce((sum, option) => sum + option.vote_count, 0);

  const rows = options.map((option) => {
    // 총 투표수가 0 이면 0 으로 나누지 않고 모두 0 으로 둔다.
    const ratio = total === 0 ? 0 : option.vote_count / total;
    return { id: option.id, label: option.label, vote_count: option.vote_count, percent: Math.round(ratio * 100), ratio };
  });

  // 결과 화면에서만 정렬한다: 득표수 내림차순, 동률이면 선택지 이름 한국어 가나다순. (DB 조회 순서는 보장하지 않음)
  rows.sort((a, b) => b.vote_count - a.vote_count || a.label.localeCompare(b.label, "ko"));

  return { total, rows };
}
