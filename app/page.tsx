import Link from "next/link";
import { connection } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listPolls } from "@/lib/polls";

export default async function Home() {
  await connection();
  const [polls, admin] = await Promise.all([listPolls(), isAdmin()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">투표 목록</h1>
        <div className="flex items-center gap-4">
          {admin ? (
            <Link href="/admin" className="text-sm font-medium underline">
              운영자 대시보드
            </Link>
          ) : (
            <Link href="/admin/login" className="text-sm font-medium underline">
              운영자 로그인
            </Link>
          )}
          <Link href="/new" className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
            투표 만들기
          </Link>
        </div>
      </div>

      {polls.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-zinc-600 dark:text-zinc-400">아직 투표가 없습니다</p>
          <Link href="/new" className="mt-3 inline-block text-sm font-medium underline">
            투표 만들기
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {polls.map((poll) => (
            <li key={poll.id}>
              <Link href={`/polls/${poll.id}`} className="block px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                {poll.question}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
