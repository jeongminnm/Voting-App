import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";

export default async function AdminDashboardPage() {
  // proxy.ts 가 먼저 막지만, matcher 가 바뀌어도 노출되지 않도록 여기서 다시 확인한다.
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">운영자 대시보드</h1>
      <Link href="/" className="self-start text-sm font-medium underline">
        투표 목록으로
      </Link>
    </div>
  );
}
