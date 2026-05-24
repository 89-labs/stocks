"use client";

import { useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

interface DevAutoSignInProps {
  callbackUrl: string;
  enabled: boolean;
}

/** Instantly signs in with the dev credentials provider (no verification). */
export function DevAutoSignIn({ callbackUrl, enabled }: DevAutoSignInProps) {
  const started = useRef(false);

  useEffect(() => {
    if (!enabled || started.current) return;
    started.current = true;
    void signIn("credentials", { callbackUrl, redirect: true });
  }, [enabled, callbackUrl]);

  if (!enabled) return null;

  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-neutral-secondary">Signing you in…</p>
    </div>
  );
}
