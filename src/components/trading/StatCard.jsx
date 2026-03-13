import React from 'react';
import { cn } from "@/lib/utils";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, className }) {
  const isPositive = trend > 0;
  const isNegative = trend < 0;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30",
      className
    )}>
      <div className="absolute top-0 right-0 w-24 h-24 -translate-y-6 translate-x-6 rounded-full bg-primary/5" />
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold font-mono tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-lg bg-secondary">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>
      {trend !== undefined && trend !== null && (
        <div className={cn(
          "mt-3 text-xs font-mono font-semibold flex items-center gap-1",
          isPositive && "text-primary glow-green",
          isNegative && "text-destructive glow-red",
          !isPositive && !isNegative && "text-muted-foreground"
        )}>
          {isPositive ? "▲" : isNegative ? "▼" : "—"} {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
  );
}