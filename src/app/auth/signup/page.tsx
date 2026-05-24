import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  authOptions,
  safeCallbackUrl,
  DEFAULT_AFTER_SIGN_IN,
} from "@/lib/auth/auth";
import { getConfiguredProviders, isRegistrationAvailable } from "@/lib/auth/providers";
import { SignUpForm } from "@/components/auth/sign-up-form";

interface PageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function SignUpPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const callbackUrl = safeCallbackUrl(params.callbackUrl ?? DEFAULT_AFTER_SIGN_IN, baseUrl);

  if (session?.user) {
    redirect(callbackUrl);
  }

  const providers = getConfiguredProviders();
  const canRegister = isRegistrationAvailable();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-neutral-heading">Create your account</h1>
        <p className="mt-2 text-sm text-neutral-secondary">
          Sign up with Google or create an account with email and password.
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-card-bg">
        {canRegister ? (
          <SignUpForm
            providers={providers}
            callbackUrl={callbackUrl}
            hasSecret={Boolean(process.env.NEXTAUTH_SECRET)}
            hasDatabase={Boolean(process.env.MONGODB_URI)}
          />
        ) : (
          <div className="space-y-4 text-sm text-neutral-secondary">
            <p>
              Sign-up requires NEXTAUTH_SECRET and MONGODB_URI. For Google, also set
              GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.
            </p>
            <Link href="/auth/signin" className="font-medium text-primary hover:underline">
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
