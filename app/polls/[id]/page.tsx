import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getPoll } from "@/lib/polls";

export default async function PollPage({ params }: PageProps<"/polls/[id]">) {
  await connection();
  const { id } = await params;
  const poll = await getPoll(id);
  if (!poll) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{poll.question}</h1>
      <ul className="flex flex-col gap-2">
        {poll.options.map((option) => (
          <li key={option.id} className="rounded-md border border-zinc-200 px-4 py-3 dark:border-zinc-800">
            {option.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
