import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, safeCallbackUrl, DEFAULT_AFTER_SIGN_IN } from "@/lib/auth/auth";
import { getConfiguredProviders } from "@/lib/auth/providers";
import { getSignInErrorMessage } from "@/lib/auth/errors";
import { SignInForm } from "@/components/auth/sign-in-form";
import { LayoutDashboard, Sparkles, Star } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

export default async function SignInPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const callbackUrl = safeCallbackUrl(params.callbackUrl ?? DEFAULT_AFTER_SIGN_IN, baseUrl);

  if (session?.user) {
    redirect(callbackUrl);
  }

  const providers = getConfiguredProviders();
  const errorMessage = params.error ? getSignInErrorMessage(params.error) : null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-neutral-heading">Sign in to NaijaStocks</h1>
        <p className="mt-2 text-sm text-neutral-secondary">
          Access your dashboard, watchlist, and AI analysis tools.
        </p>
      </div>

      <ul className="mt-6 grid grid-cols-3 gap-3 text-center">
        {[
          { icon: LayoutDashboard, label: "Dashboard" },
          { icon: Star, label: "Watchlist" },
          { icon: Sparkles, label: "AI tools" },
        ].map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-3 dark:border-slate-700 dark:bg-slate-800/50"
          >
            <Icon className="mx-auto h-5 w-5 text-[#00A651]" />
            <p className="mt-1 text-xs font-medium text-neutral-secondary">{label}</p>
          </li>
        ))}
      </ul>

      {errorMessage && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {errorMessage}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-card-bg">
        <SignInForm
          providers={providers}
          callbackUrl={callbackUrl}
          hasSecret={Boolean(process.env.NEXTAUTH_SECRET)}
          hasDatabase={Boolean(process.env.MONGODB_URI)}
        />
      </div>

      <p className="mt-6 text-center text-xs text-neutral-secondary">
        Market data is free without an account.{" "}
        <Link href="/" className="text-primary hover:underline">
          Browse stocks
        </Link>
      </p>
    </div>
  );
}
