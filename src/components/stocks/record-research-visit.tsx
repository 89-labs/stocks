"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

export function RecordResearchVisit({ ticker }: { ticker: string }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker }),
      }).catch(() => {});
    }
  }, [ticker, session]);

  return null;
}
