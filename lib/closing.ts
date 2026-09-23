// 마감 시각(closes_at)이 있고 현재 시각이 그 시각과 같거나 지났으면 마감된 투표다. null 이면 마감 없음.
// now 는 서버에서 판정할 때의 현재 시각이며, 기본값은 호출 시점이다.
export function isClosed(closesAt: string | null, now: Date = new Date()): boolean {
  return closesAt !== null && now.getTime() >= Date.parse(closesAt);
}
