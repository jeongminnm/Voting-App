import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getPoll } from "@/lib/polls";
import { VoteForm } from "./vote-form";

export default async function PollPage({ params }: PageProps<"/polls/[id]">) {
  await connection();
  const { id } = await params;
  const poll = await getPoll(id);
  if (!poll) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{poll.question}</h1>
      <VoteForm pollId={poll.id} options={poll.options} />
    </div>
  );
}
