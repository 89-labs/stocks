import Link from "next/link";
import { LineChart } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-card-bg">
        <Link href="/" className="mx-auto flex max-w-md items-center gap-2">
          <LineChart className="h-7 w-7 text-[#00A651]" />
          <span className="text-xl font-bold text-neutral-heading">
            Naija<span className="text-[#00A651]">Stocks</span>
          </span>
        </Link>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="border-t border-slate-200 px-4 py-6 text-center text-xs text-neutral-secondary dark:border-slate-700">
        Secure sign-in · Your data stays private
      </footer>
    </div>
  );
}
