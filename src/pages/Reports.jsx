import React from 'react';
import { useLanguage } from '@/components/context/LanguageContext';
import { useDB, useQK } from '../components/trading/useDB';
import { useQuery } from '@tanstack/react-query';
import PnLChart from '../components/trading/PnLChart';
import StatCard from '../components/trading/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Trophy, TrendingUp, TrendingDown, Target, Shield, BarChart3 } from "lucide-react";

const strategyLabels = {
  quick_flip: "Quick Flip", momentum: "Momentum", dip_buy: "Dip Buy", volume_spike: "Volume Spike",
};

export default function Reports() {
  const { t } = useLanguage();
  const db = useDB();
  const tradesQK = useQK('trades');

  const { data: trades = [] } = useQuery({
    queryKey: tradesQK,
    queryFn: () => db.SimulatedTrade.list('-created_date', 500),
  });

  const closed = trades.filter(tr => tr.status !== 'open');
  const wins = closed.filter(tr => (tr.profit_loss_sol || 0) > 0);
  const losses = closed.filter(tr => (tr.profit_loss_sol || 0) < 0);
  const totalPnl = closed.reduce((s, tr) => s + (tr.profit_loss_sol || 0), 0);
  const totalInvested = closed.reduce((s, tr) => s + (tr.amount_sol || 0), 0);
  const avgWin = wins.length > 0 ? wins.reduce((s, tr) => s + (tr.profit_loss_pct || 0), 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((s, tr) => s + (tr.profit_loss_pct || 0), 0) / losses.length : 0;
  const biggestWin = wins.length > 0 ? Math.max(...wins.map(tr => tr.profit_loss_sol || 0)) : 0;
  const biggestLoss = losses.length > 0 ? Math.min(...losses.map(tr => tr.profit_loss_sol || 0)) : 0;
  const roi = totalInvested > 0 ? (totalPnl / totalInvested * 100) : 0;

  const strategyData = Object.entries(
    closed.reduce((acc, tr) => {
      const s = tr.strategy || 'unknown';
      if (!acc[s]) acc[s] = { wins: 0, losses: 0, pnl: 0, count: 0 };
      acc[s].count++;
      acc[s].pnl += tr.profit_loss_sol || 0;
      if ((tr.profit_loss_sol || 0) > 0) acc[s].wins++;
      else acc[s].losses++;
      return acc;
    }, {})
  ).map(([key, val]) => ({
    name: strategyLabels[key] || key, ...val,
    winRate: val.count > 0 ? (val.wins / val.count * 100) : 0,
  }));

  const slTriggered = closed.filter(tr => tr.stop_loss_triggered).length;
  const tpTriggered = closed.filter(tr => tr.take_profit_triggered).length;

  const pieData = [
    { name: t('reports.wins_label'), value: wins.length },
    { name: t('reports.losses_label'), value: losses.length },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
        <p className="text-xs font-semibold">{payload[0].payload.name}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs text-muted-foreground">{p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('reports.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('reports.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('reports.roi')} value={`${roi.toFixed(1)}%`} icon={TrendingUp} trend={roi} />
        <StatCard title={t('reports.win_rate')} value={`${closed.length > 0 ? (wins.length / closed.length * 100).toFixed(1) : 0}%`} icon={Trophy} />
        <StatCard title={t('reports.biggest_win')} value={`+${biggestWin.toFixed(4)} SOL`} icon={TrendingUp} />
        <StatCard title={t('reports.biggest_loss')} value={`${biggestLoss.toFixed(4)} SOL`} icon={TrendingDown} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">{t('reports.pnl_title')}</CardTitle>
          </CardHeader>
          <CardContent><PnLChart trades={trades} /></CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">{t('reports.pie_title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {closed.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm font-mono">{t('reports.no_closed2')}</div>
            ) : (
              <div className="flex items-center justify-center gap-8">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} innerRadius={45} dataKey="value" strokeWidth={0}>
                      <Cell fill="hsl(142, 72%, 50%)" />
                      <Cell fill="hsl(0, 72%, 55%)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-sm">{wins.length} {t('reports.wins_label')}</span>
                    <span className="text-xs text-muted-foreground">({avgWin.toFixed(1)}% {t('reports.avg_label')})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive" />
                    <span className="text-sm">{losses.length} {t('reports.losses_label')}</span>
                    <span className="text-xs text-muted-foreground">({avgLoss.toFixed(1)}% {t('reports.avg_label')})</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <Shield className="w-3 h-3 text-destructive" />
                    <span className="text-xs text-muted-foreground">SL: {slTriggered}x</span>
                    <Target className="w-3 h-3 text-primary ml-2" />
                    <span className="text-xs text-muted-foreground">TP: {tpTriggered}x</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> {t('reports.strategy_title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {strategyData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm font-mono">{t('reports.no_strategy2')}</div>
          ) : (
            <div className="space-y-6">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={strategyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(215, 14%, 50%)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 14%, 50%)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="pnl" name="P&L (SOL)" radius={[4, 4, 0, 0]}>
                    {strategyData.map((entry, i) => (
                      <Cell key={i} fill={entry.pnl >= 0 ? "hsl(142, 72%, 50%)" : "hsl(0, 72%, 55%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {strategyData.map((strat) => (
                  <div key={strat.name} className="p-3 rounded-lg border border-border bg-secondary/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">{strat.name}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">{strat.count} {t('reports.trades')}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-muted-foreground">{t('reports.win_rate_label')}</span>
                        <p className="font-semibold">{strat.winRate.toFixed(0)}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">P&L</span>
                        <p className={`font-semibold ${strat.pnl >= 0 ? 'text-primary' : 'text-destructive'}`}>
                          {strat.pnl >= 0 ? '+' : ''}{strat.pnl.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}