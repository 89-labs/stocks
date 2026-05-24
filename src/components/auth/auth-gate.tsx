"use client";

import { signIn } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AuthGateProps {
  title: string;
  description: string;
  preview?: React.ReactNode;
}

export function AuthGate({ title, description, preview }: AuthGateProps) {
  const pathname = usePathname();

  return (
    <div className="relative">
      {preview && (
        <div className="pointer-events-none select-none blur-sm opacity-60">
          {preview}
        </div>
      )}
      <Card className={preview ? "absolute inset-0 bg-card-bg/80 backdrop-blur-sm" : ""}>
        <CardContent className="flex flex-col items-center justify-center gap-4 p-8 text-center min-h-[200px]">
          <Lock className="h-8 w-8 text-primary" />
          <h3 className="text-lg font-semibold text-neutral-heading">{title}</h3>
          <p className="max-w-sm text-sm text-neutral-secondary">{description}</p>
          <Button onClick={() => signIn(undefined, { callbackUrl: pathname })}>
            Sign In to Unlock
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
