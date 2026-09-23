import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { isClosed } from "@/lib/closing";
import { formatKst } from "@/lib/kst";
import { getPoll } from "@/lib/polls";
import { VoteForm } from "./vote-form";

export default async function PollPage({ params }: PageProps<"/polls/[id]">) {
  await connection();
  const { id } = await params;
  const poll = await getPoll(id);
  if (!poll) notFound();
  const closed = isClosed(poll.closes_at);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{poll.question}</h1>
        {closed ? (
          <p className="text-sm font-medium text-red-600">마감된 투표입니다</p>
        ) : (
          poll.closes_at && <p className="text-sm text-zinc-500">마감: {formatKst(poll.closes_at)}</p>
        )}
      </div>
      <VoteForm pollId={poll.id} options={poll.options} closed={closed} />
      <Link href={`/polls/${poll.id}/results`} className="self-start text-sm font-medium underline">
        결과 보기
      </Link>
    </div>
  );
}
