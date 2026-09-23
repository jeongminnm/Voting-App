// 마감 시각은 항상 한국 시간(KST, +09:00)으로 해석하고 표시한다 (ADR-0002).
// 실행 환경(브라우저·서버)의 시간대에 의존하지 않도록 문자열로만 변환한다.

// datetime-local 값("YYYY-MM-DDTHH:mm")을 KST 절대 시각 ISO 문자열("YYYY-MM-DDTHH:mm:00+09:00")로 바꾼다.
export function kstLocalToIso(value: string): string {
  return `${value}:00+09:00`;
}

const KST_PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

// 절대 시각(ISO 문자열)을 "YYYY-MM-DD HH:mm (KST)" 로 표시한다. 서버가 UTC 여도 항상 Asia/Seoul 기준이다.
export function formatKst(iso: string): string {
  const parts = Object.fromEntries(KST_PARTS.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} (KST)`;
}
