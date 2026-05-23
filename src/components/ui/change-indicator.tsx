"use client";

import { cn } from "@/lib/utils";
import { getChangeColor, getChangeIcon, formatPercent } from "@/lib/utils";

interface ChangeIndicatorProps {
  value: number;
  className?: string;
  showIcon?: boolean;
}

export function ChangeIndicator({ value, className, showIcon = true }: ChangeIndicatorProps) {
  return (
    <span className={cn("font-bold", getChangeColor(value), className)}>
      {showIcon && `${getChangeIcon(value)} `}
      {formatPercent(value)}
    </span>
  );
}
