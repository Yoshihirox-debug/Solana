import React from 'react';
import { cn } from "@/lib/utils";
import { Info, AlertTriangle, XCircle, CheckCircle2, Repeat } from "lucide-react";
import moment from "moment";

const levelConfig = {
  info: { icon: Info, color: "text-chart-4", bg: "bg-chart-4/10", border: "border-chart-4/20" },
  warning: { icon: AlertTriangle, color: "text-chart-3", bg: "bg-chart-3/10", border: "border-chart-3/20" },
  error: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
  success: { icon: CheckCircle2, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
  trade: { icon: Repeat, color: "text-accent", bg: "bg-accent/10", border: "border-accent/20" },
};

export default function LogEntry({ log }) {
  const config = levelConfig[log.level] || levelConfig.info;
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-start gap-3 py-2 px-3 rounded-md border transition-all hover:bg-secondary/30",
      config.border, config.bg
    )}>
      <Icon className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", config.color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {log.token_symbol && (
            <span className="text-xs font-mono font-bold text-foreground">[{log.token_symbol}]</span>
          )}
          {log.category && (
            <span className="text-[10px] font-mono uppercase text-muted-foreground">{log.category}</span>
          )}
        </div>
        <p className="text-xs font-mono text-foreground/80 mt-0.5 break-words">{log.message}</p>
      </div>
      <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
        {moment(log.created_date).format("HH:mm:ss")}
      </span>
    </div>
  );
}