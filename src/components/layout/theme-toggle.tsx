"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={cn("h-9 w-[4.5rem] rounded-lg bg-muted", className)}
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div
      className={cn(
        "flex rounded-lg border border-border bg-muted p-0.5",
        className
      )}
      role="group"
      aria-label="Color theme"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
          !isDark
            ? "bg-card-bg text-neutral-heading shadow-sm"
            : "text-neutral-secondary hover:text-neutral-heading"
        )}
        aria-pressed={!isDark}
        aria-label="Light mode"
      >
        <Sun className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Light</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
          isDark
            ? "bg-card-bg text-neutral-heading shadow-sm"
            : "text-neutral-secondary hover:text-neutral-heading"
        )}
        aria-pressed={isDark}
        aria-label="Dark mode"
      >
        <Moon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Dark</span>
      </button>
    </div>
  );
}
