"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthField } from "@/components/auth/auth-field";
import { GoogleOAuthButton, AuthOrDivider } from "@/components/auth/google-oauth-button";
import { getSignInErrorMessage } from "@/lib/auth/errors";
import type { AuthProviderMeta } from "@/lib/auth/providers";

interface SignUpFormProps {
  providers: AuthProviderMeta[];
  callbackUrl: string;
  hasSecret: boolean;
  hasDatabase: boolean;
}

export function SignUpForm({ providers, callbackUrl, hasSecret, hasDatabase }: SignUpFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const hasGoogle = providers.some((p) => p.id === "google");
  const hasCredentials = providers.some((p) => p.id === "credentials");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = (await res.json()) as { error?: string; ok?: boolean };

      if (!res.ok || data.error) {
        setFormError(data.error ?? "Could not create account.");
        setLoading(false);
        return;
      }

      const signInResult = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        callbackUrl,
        redirect: false,
      });

      if (signInResult?.error) {
        setFormError(
          "Account created, but sign-in failed. Please sign in with your email and password."
        );
        setLoading(false);
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }

      if (signInResult?.ok) {
        router.push(callbackUrl);
        router.refresh();
        return;
      }

      setFormError(getSignInErrorMessage("Default"));
      setLoading(false);
    } catch {
      setFormError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (!hasSecret) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        <p className="font-medium">Set NEXTAUTH_SECRET in your .env file</p>
      </div>
    );
  }

  if (!hasDatabase) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        <p className="font-medium">Set MONGODB_URI in your .env file</p>
        <p className="mt-2 text-xs">Accounts require MongoDB to store users securely.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasGoogle && (
        <GoogleOAuthButton
          callbackUrl={callbackUrl}
          mode="signup"
          disabled={loading}
          onError={(msg) => setFormError(msg)}
        />
      )}

      {hasGoogle && hasCredentials && <AuthOrDivider />}

      {hasCredentials && (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <AuthField
            id="username"
            label="Username"
            type="text"
            value={username}
            onChange={setUsername}
            placeholder="johndoe"
            autoComplete="username"
            disabled={loading}
            hint="3–30 characters, letters, numbers, and underscores only"
          />
          <AuthField
            id="signup-email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading}
          />
          <AuthField
            id="signup-password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            disabled={loading}
          />
          <AuthField
            id="confirm-password"
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Repeat your password"
            autoComplete="new-password"
            disabled={loading}
          />

          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {formError}
            </p>
          )}

          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create account
          </Button>
        </form>
      )}

      {formError && !hasCredentials && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {formError}
        </p>
      )}

      <p className="text-center text-sm text-neutral-secondary">
        Already have an account?{" "}
        <Link
          href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
