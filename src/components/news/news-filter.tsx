"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface NewsFilterProps {
  segments: string[];
  activeSegment?: string;
}

export function NewsFilter({ segments, activeSegment }: NewsFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <FilterChip href="/news" label="All" active={!activeSegment} />
      {segments.map((s) => (
        <FilterChip
          key={s}
          href={`/news?segment=${encodeURIComponent(s)}&page=1`}
          label={s}
          active={activeSegment === s}
        />
      ))}
    </div>
  );
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-white"
          : "bg-muted text-neutral-secondary hover:bg-muted"
      )}
    >
      {label}
    </Link>
  );
}
