import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getPoll } from "@/lib/polls";

export default async function ResultsPage({ params }: PageProps<"/polls/[id]/results">) {
  await connection();
  const { id } = await params;
  const poll = await getPoll(id);
  if (!poll) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-zinc-500">결과</p>
        <h1 className="text-2xl font-semibold">{poll.question}</h1>
      </div>

      <ul className="flex flex-col divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {poll.options.map((option) => (
          <li key={option.id} className="flex items-center justify-between px-4 py-3">
            <span>{option.label}</span>
            <span className="font-medium tabular-nums">{option.vote_count}표</span>
          </li>
        ))}
      </ul>

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
