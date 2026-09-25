import Link from "next/link";
import { LoginForm } from "./login-form";

// 이미 로그인한 운영자는 proxy.ts 가 /admin 으로 보낸다.
export default function AdminLoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">운영자 로그인</h1>
      <LoginForm />
      <Link href="/" className="self-start text-sm font-medium underline">
        투표 목록으로
      </Link>
    </div>
  );
}
