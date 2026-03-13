import React from 'react';
import { cn } from "@/lib/utils";

export default function StatusIndicator({ active, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "w-2 h-2 rounded-full",
        active ? "bg-primary animate-pulse-glow" : "bg-destructive"
      )} />
      <span className={cn(
        "text-xs font-mono uppercase tracking-wider",
        active ? "text-primary" : "text-destructive"
      )}>
        {label || (active ? "En ligne" : "Hors ligne")}
      </span>
    </div>
  );
}