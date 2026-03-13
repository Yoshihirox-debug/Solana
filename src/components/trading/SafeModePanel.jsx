import React, { useState } from 'react';
import { useSafeMode } from '@/components/context/SafeModeContext';
import { useLanguage } from '@/components/context/LanguageContext';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Square, Clock, CheckCircle2, BarChart3, Target, Layers, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
}

export default function SafeModePanel() {
  const [duration, setDuration] = useState(60);
  const { isRunning, start, stop, remainingMs, progress, tradesCount, totalPnl, SAFE_SETTINGS } = useSafeMode();
  const { t } = useLanguage();

  const PRESETS = [
    { label: '30min', value: 30 },
    { label: '1h', value: 60 },
    { label: '2h', value: 120 },
    { label: '4h', value: 240 },
    { label: '8h', value: 480 },
  ];

  const durationLabel = duration >= 60 ? `${duration / 60}h` : `${duration}min`;

  return (
    <Card className={cn("border-2 transition-all", isRunning ? "border-primary/40 bg-primary/5 shadow-[0_0_20px_hsl(142_72%_50%/0.1)]" : "border-border bg-card")}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className={cn("w-4 h-4", isRunning ? "text-primary animate-pulse" : "text-muted-foreground")} />
          {t('safe.title')}
          {isRunning && <Badge className="bg-primary/20 text-primary border-primary/30 text-xs ml-auto animate-pulse">{t('safe.running')}</Badge>}
        </CardTitle>
        <CardDescription>
          {t('safe.desc')} {SAFE_SETTINGS.stop_loss_pct}% · {t('safe.desc2')} {SAFE_SETTINGS.take_profit_pct}% · {t('safe.desc3')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Stats when running */}
        {isRunning && (
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-secondary/50 text-center">
              <p className="text-xs text-muted-foreground font-mono">{t('safe.remaining')}</p>
              <p className="text-sm font-bold font-mono text-primary">{formatTime(remainingMs)}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 text-center">
              <p className="text-xs text-muted-foreground font-mono">{t('safe.trades')}</p>
              <p className="text-sm font-bold font-mono">{tradesCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 text-center">
              <p className="text-xs text-muted-foreground font-mono">P&L</p>
              <p className={cn("text-sm font-bold font-mono", totalPnl >= 0 ? "text-primary" : "text-destructive")}>
                {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(4)}
              </p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        {isRunning && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono text-muted-foreground">
              <span>{t('safe.progress')}</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Duration picker */}
        {!isRunning && (
          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Clock className="w-3 h-3" /> {t('safe.duration')}
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(p => (
                <button key={p.value} onClick={() => setDuration(p.value)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-mono border transition-all",
                    duration === p.value ? "bg-primary/10 border-primary/40 text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                  )}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono text-muted-foreground">
                <span>{t('safe.custom')}</span>
                <span className="text-primary font-bold">{durationLabel}</span>
              </div>
              <Slider value={[duration]} onValueChange={([v]) => setDuration(v)} min={15} max={720} step={15} />
            </div>
          </div>
        )}

        {/* Strategy info */}
        {!isRunning && (
          <div className="p-3 rounded-lg bg-secondary/30 border border-border space-y-2">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{t('safe.params_title')}</p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                <span>{t('safe.stake')}: {SAFE_SETTINGS.investment_per_trade_sol} SOL</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                <span>{t('safe.max_trades')}: {SAFE_SETTINGS.max_open_trades}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 text-destructive shrink-0" />
                <span>{t('safe.stop')}: -{SAFE_SETTINGS.stop_loss_pct}%</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                <span>{t('safe.tp')}: +{SAFE_SETTINGS.take_profit_pct}%</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 text-chart-3 shrink-0" />
                <span>{t('safe.scan_freq')}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 text-chart-4 shrink-0" />
                <span>{t('safe.strategies')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Start / Stop */}
        <Button
          onClick={() => isRunning ? stop() : start(duration)}
          className={cn("w-full font-semibold", isRunning
            ? "bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30"
            : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_12px_hsl(142_72%_50%/0.3)]"
          )}
        >
          {isRunning
            ? <><Square className="w-4 h-4 mr-2" /> {t('safe.stop_btn')}</>
            : <><Shield className="w-4 h-4 mr-2" /> {t('safe.start_btn')} · {durationLabel}</>
          }
        </Button>
      </CardContent>
    </Card>
  );
}