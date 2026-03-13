import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, TrendingUp, TrendingDown, Clock, CheckCircle2, ShieldAlert } from "lucide-react";
import moment from "moment";
import { useLanguage } from '@/components/context/LanguageContext';

const strategyLabels = {
  quick_flip: "Quick Flip",
  momentum: "Momentum",
  dip_buy: "Dip Buy",
  volume_spike: "Volume Spike",
};

export default function TradeRow({ trade, onCloseTrade }) {
  const { t } = useLanguage();
  const pnl = trade.profit_loss_sol || 0;
  const pnlPct = trade.profit_loss_pct || 0;
  const isProfit = pnl > 0;

  const statusConfig = {
    open:    { label: t('trade.status.open'),    icon: Clock,         color: "text-chart-3 border-chart-3/30 bg-chart-3/10" },
    closed:  { label: t('trade.status.closed'),  icon: CheckCircle2,  color: "text-primary border-primary/30 bg-primary/10" },
    stopped: { label: t('trade.status.stopped'), icon: ShieldAlert,   color: "text-destructive border-destructive/30 bg-destructive/10" },
  };

  const status = statusConfig[trade.status] || statusConfig.open;
  const StatusIcon = status.icon;

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-border/50 bg-card/50 hover:bg-secondary/30 transition-all">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0",
          isProfit ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
        )}>
          {trade.token_symbol?.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{trade.token_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", status.color)}>
              <StatusIcon className="w-2.5 h-2.5 mr-0.5" /> {status.label}
            </Badge>
            {trade.strategy && (
              <span className="text-[10px] text-muted-foreground font-mono">
                {strategyLabels[trade.strategy] || trade.strategy}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="text-right hidden sm:block">
          <p className="text-[10px] text-muted-foreground font-mono">{t('trade.buy_col')}</p>
          <p className="text-xs font-mono">{trade.buy_price?.toFixed(8)}</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[10px] text-muted-foreground font-mono">{t('trade.sell_col')}</p>
          <p className="text-xs font-mono">{trade.sell_price ? trade.sell_price.toFixed(8) : "—"}</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-[10px] text-muted-foreground font-mono">{t('trade.investment_col')}</p>
          <p className="text-xs font-mono">{trade.amount_sol} SOL</p>
        </div>
        <div className={cn("text-right min-w-[80px]", trade.status === "open" && "opacity-50")}>
          <p className="text-[10px] text-muted-foreground font-mono">P&L</p>
          <div className={cn(
            "flex items-center gap-1 justify-end font-mono text-sm font-bold",
            isProfit ? "text-primary" : pnl < 0 ? "text-destructive" : "text-muted-foreground"
          )}>
            {trade.status !== "open" && (isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />)}
            {trade.status === "open" ? "..." : `${isProfit ? "+" : ""}${pnl.toFixed(3)} SOL`}
          </div>
          {trade.status !== "open" && (
            <p className={cn("text-[10px] font-mono", isProfit ? "text-primary/70" : "text-destructive/70")}>
              {isProfit ? "+" : ""}{pnlPct.toFixed(1)}%
            </p>
          )}
        </div>
        <div className="text-right hidden lg:block">
          <p className="text-[10px] text-muted-foreground font-mono">{t('trades.date')}</p>
          <p className="text-xs font-mono">{moment(trade.buy_timestamp || trade.created_date).fromNow()}</p>
        </div>
        {trade.status === "open" && onCloseTrade && (
          <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => onCloseTrade(trade)}>
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}