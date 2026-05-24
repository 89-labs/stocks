"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2, Mail, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AuthProviderMeta } from "@/lib/auth/providers";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

interface SignInFormProps {
  providers: AuthProviderMeta[];
  callbackUrl: string;
  hasSecret: boolean;
  hasDatabase: boolean;
  devAuthEnabled: boolean;
}

export function SignInForm({
  providers,
  callbackUrl,
  hasSecret,
  hasDatabase,
  devAuthEnabled,
}: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"google" | "email" | "credentials" | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const hasGoogle = providers.some((p) => p.id === "google");
  const hasEmail = providers.some((p) => p.id === "email");
  const hasCredentials = providers.some((p) => p.id === "credentials");

  const handleDevLogin = async () => {
    setFormError(null);
    setLoading("credentials");
    try {
      await signIn("credentials", { callbackUrl, redirect: true });
    } catch {
      setFormError("Could not sign in. Please try again.");
      setLoading(null);
    }
  };

  const handleGoogle = async () => {
    setFormError(null);
    setLoading("google");
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setFormError("Could not start Google sign-in. Please try again.");
      setLoading(null);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setFormError("Enter a valid email address.");
      return;
    }

    setLoading("email");
    try {
      const result = await signIn("email", {
        email: trimmed,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setFormError("Could not send magic link. Check your email settings.");
        setLoading(null);
        return;
      }

      setEmailSent(true);
      setLoading(null);
    } catch {
      setFormError("Could not send magic link. Please try again.");
      setLoading(null);
    }
  };

  if (!hasSecret) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        <p className="font-medium">Set NEXTAUTH_SECRET in your .env file</p>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-neutral-secondary dark:border-slate-700 dark:bg-slate-800/50">
        <p className="font-medium text-neutral-heading">No sign-in providers configured</p>
        <p className="mt-2 text-xs">
          Set <code className="text-primary">DEV_AUTH_ENABLED=true</code> for instant local login,
          or configure Google OAuth / email SMTP.
        </p>
      </div>
    );
  }

  if (emailSent) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-900 dark:bg-green-950/30">
        <Mail className="mx-auto h-8 w-8 text-primary" />
        <p className="mt-3 font-semibold text-neutral-heading">Check your inbox</p>
        <p className="mt-2 text-sm text-neutral-secondary">
          We sent a sign-in link to <strong>{email}</strong>. Click the link to continue.
        </p>
        <button
          type="button"
          onClick={() => setEmailSent(false)}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasCredentials && (
        <>
          <Button
            type="button"
            className="w-full gap-2"
            disabled={loading !== null}
            onClick={() => void handleDevLogin()}
          >
            {loading === "credentials" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LayoutDashboard className="h-4 w-4" />
            )}
            Continue to dashboard
          </Button>
          {devAuthEnabled && (
            <p className="text-center text-xs text-neutral-secondary">
              Dev mode — no email or OAuth verification required
            </p>
          )}
        </>
      )}

      {hasCredentials && (hasGoogle || hasEmail) && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200 dark:border-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-neutral-secondary dark:bg-card-bg">or</span>
          </div>
        </div>
      )}

      {hasGoogle && (
        <Button
          type="button"
          variant="outline"
          className="w-full gap-3"
          disabled={loading !== null}
          onClick={() => void handleGoogle()}
        >
          {loading === "google" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="h-5 w-5" />
          )}
          Continue with Google
        </Button>
      )}

      {hasEmail && (
        <form onSubmit={(e) => void handleEmail(e)} className="space-y-3">
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading !== null}
              className={cn(
                "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none",
                "focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-input-bg"
              )}
            />
          </div>
          <Button type="submit" variant="outline" className="w-full gap-2" disabled={loading !== null}>
            {loading === "email" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Send magic link
          </Button>
        </form>
      )}

      {formError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {formError}
        </p>
      )}

      {!hasDatabase && hasCredentials && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          MONGODB_URI not set — watchlist and portfolio data won&apos;t persist.
        </p>
      )}
    </div>
  );
}
