"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthField } from "@/components/auth/auth-field";
import { GoogleOAuthButton, AuthOrDivider } from "@/components/auth/google-oauth-button";
import { getSignInErrorMessage } from "@/lib/auth/errors";
import type { AuthProviderMeta } from "@/lib/auth/providers";

interface SignInFormProps {
  providers: AuthProviderMeta[];
  callbackUrl: string;
  hasSecret: boolean;
  hasDatabase: boolean;
}

export function SignInForm({
  providers,
  callbackUrl,
  hasSecret,
  hasDatabase,
}: SignInFormProps) {
  const router = useRouter();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [magicEmail, setMagicEmail] = useState("");
  const [loading, setLoading] = useState<"email" | "credentials" | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const hasGoogle = providers.some((p) => p.id === "google");
  const hasMagicLink = providers.some((p) => p.id === "email");
  const hasCredentials = providers.some((p) => p.id === "credentials");

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading("credentials");

    try {
      const result = await signIn("credentials", {
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setFormError("Invalid email or password.");
        setLoading(null);
        return;
      }

      if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
        return;
      }

      setFormError(getSignInErrorMessage("Default"));
      setLoading(null);
    } catch {
      setFormError(getSignInErrorMessage("Default"));
      setLoading(null);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmed = magicEmail.trim();
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
        setFormError(getSignInErrorMessage(result.error));
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
        <p className="mt-2 text-xs opacity-90">
          Run: <code className="font-mono">openssl rand -base64 32</code>
        </p>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-neutral-secondary dark:border-slate-700 dark:bg-slate-800/50">
        <p className="font-medium text-neutral-heading">No sign-in providers configured</p>
        <p className="mt-2 text-xs">
          Set <code className="text-primary">MONGODB_URI</code> for email/password, or configure
          Google OAuth / email SMTP.
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
          We sent a sign-in link to <strong>{magicEmail}</strong>.
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
        <form onSubmit={(e) => void handlePasswordLogin(e)} className="space-y-4">
          <AuthField
            id="login-email"
            label="Email"
            type="email"
            value={loginEmail}
            onChange={setLoginEmail}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading !== null}
          />
          <AuthField
            id="login-password"
            label="Password"
            type="password"
            value={loginPassword}
            onChange={setLoginPassword}
            placeholder="Your password"
            autoComplete="current-password"
            disabled={loading !== null}
          />
          <Button type="submit" className="w-full gap-2" disabled={loading !== null}>
            {loading === "credentials" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            Sign in
          </Button>
          <p className="text-center text-sm text-neutral-secondary">
            Don&apos;t have an account?{" "}
            <Link
              href={`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </p>
        </form>
      )}

      {hasCredentials && (hasGoogle || hasMagicLink) && <AuthOrDivider />}

      {hasGoogle && (
        <GoogleOAuthButton
          callbackUrl={callbackUrl}
          mode="signin"
          disabled={loading !== null}
          onError={(msg) => setFormError(msg)}
        />
      )}

      {hasMagicLink && (
        <form onSubmit={(e) => void handleMagicLink(e)} className="space-y-3">
          <AuthField
            id="magic-email"
            label="Magic link email"
            type="email"
            value={magicEmail}
            onChange={setMagicEmail}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading !== null}
          />
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
          MONGODB_URI not set — accounts cannot be created or verified.
        </p>
      )}
    </div>
  );
}
