"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24">
      <LineChart className="h-12 w-12 text-primary" />
      <h1 className="mt-4 text-2xl font-bold text-neutral-heading">Sign in to NaijaStocks</h1>
      <p className="mt-2 text-center text-neutral-secondary">
        Unlock watchlists, portfolio tracking, research history, and unlimited trade simulations.
      </p>

      <Card className="mt-8 w-full">
        <CardContent className="space-y-3 p-6">
          <Button onClick={() => signIn("google")} className="w-full" variant="outline">
            Continue with Google
          </Button>
          <Button onClick={() => signIn("email")} className="w-full">
            Sign in with Email
          </Button>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-neutral-secondary">
        All market data is available without signing in. Authentication unlocks personal features only.
      </p>
    </div>
  );
}
