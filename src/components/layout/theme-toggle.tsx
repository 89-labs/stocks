"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type ThemeToggleVariant = "segment" | "icon";

export function ThemeToggle({
  className,
  variant = "segment",
}: {
  className?: string;
  variant?: ThemeToggleVariant;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={cn(
          variant === "icon" ? "h-9 w-9 rounded-xl bg-muted" : "h-9 w-[4.5rem] rounded-lg bg-muted",
          className
        )}
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
          className
        )}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex rounded-xl border border-slate-200/80 bg-slate-100/80 p-0.5 dark:border-slate-700 dark:bg-slate-900/80",
        className
      )}
      role="group"
      aria-label="Color theme"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={cn(
          "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
          !isDark
            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
            : "text-slate-500 hover:text-slate-300"
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
          "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
          isDark
            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
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
