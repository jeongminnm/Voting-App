import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { isClosed } from "@/lib/closing";
import { formatKst } from "@/lib/kst";
import { getPoll } from "@/lib/polls";
import { calculateResults } from "@/lib/results";
import { ResultBar } from "./result-bar";

export default async function ResultsPage({ params }: PageProps<"/polls/[id]/results">) {
  await connection();
  const { id } = await params;
  const poll = await getPoll(id);
  if (!poll) notFound();
  const results = calculateResults(poll.options);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-zinc-500">결과</p>
        <h1 className="text-2xl font-semibold">{poll.question}</h1>
        {poll.closes_at && (
          <p className="text-sm text-zinc-500">
            {isClosed(poll.closes_at) && <span className="font-medium text-red-600">마감된 투표입니다 · </span>}
            마감: {formatKst(poll.closes_at)}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex flex-col gap-1">
          <p className="font-medium tabular-nums">총 {results.total}표</p>
          {results.total === 0 && <p className="text-sm text-zinc-500">아직 아무도 투표하지 않았습니다.</p>}
        </div>
        <ul className="flex flex-col gap-4">
          {results.rows.map((row) => (
            <ResultBar key={row.id} row={row} />
          ))}
        </ul>
      </div>

      <div className="flex gap-4 text-sm">
        <Link href={`/polls/${poll.id}`} className="font-medium underline">
          투표 화면으로
        </Link>
        <Link href="/" className="font-medium underline">
          목록으로
        </Link>
      </div>
    </div>
  );
}
