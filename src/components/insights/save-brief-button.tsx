"use client";

import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import type { MarketBrief } from "@/types";

export function SaveBriefButton({ brief }: { brief: MarketBrief }) {
  const { data: session } = useSession();

  const handleSave = async () => {
    if (!session) {
      signIn();
      return;
    }

    await fetch("/api/briefs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: brief }),
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleSave}>
      <Bookmark className="h-4 w-4" />
      {session ? "Save Brief" : "Sign in to Save"}
    </Button>
  );
}
