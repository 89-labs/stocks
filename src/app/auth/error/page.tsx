import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { getSignInErrorMessage } from "@/lib/auth/errors";

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function AuthErrorPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const message = getSignInErrorMessage(params.error);

  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      <AlertCircle className="h-12 w-12 text-red-500" />
      <h1 className="mt-4 text-2xl font-bold text-neutral-heading">Sign-in error</h1>
      <p className="mt-2 text-sm text-neutral-secondary">{message}</p>
      <Link
        href="/auth/signin"
        className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90"
      >
        Try again
      </Link>
    </div>
  );
}
