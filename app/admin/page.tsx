import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { isClosed } from "@/lib/closing";
import { formatKst } from "@/lib/kst";
import { listAdminPolls } from "@/lib/polls";

export default async function AdminDashboardPage() {
  await connection();
  // proxy.ts 가 먼저 막지만, matcher 가 바뀌어도 노출되지 않도록 여기서 다시 확인한다.
  if (!(await isAdmin())) redirect("/admin/login");
  const polls = await listAdminPolls();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">운영자 대시보드</h1>
      <Link href="/" className="self-start text-sm font-medium underline">
        투표 목록으로
      </Link>
      {polls.length === 0 ? (
        <p>아직 투표가 없습니다</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {polls.map((poll) => {
            const closingStatus =
              poll.closes_at === null
                ? "마감 없음"
                : isClosed(poll.closes_at)
                  ? "마감됨"
                  : `진행 중 · 마감: ${formatKst(poll.closes_at)}`;

            return (
              <li key={poll.id} className="flex flex-col gap-2 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
                <h2 className="font-semibold">{poll.question}</h2>
                <p className="text-sm text-zinc-500">만든 시각: {formatKst(poll.created_at)}</p>
                <p className="text-sm text-zinc-500">{closingStatus}</p>
                <p className="font-medium tabular-nums">총 {poll.total_votes}표</p>
                <div className="flex gap-4 text-sm">
                  <Link href={`/polls/${poll.id}`} className="font-medium underline">
                    투표 화면
                  </Link>
                  <Link href={`/polls/${poll.id}/results`} className="font-medium underline">
                    결과 보기
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
