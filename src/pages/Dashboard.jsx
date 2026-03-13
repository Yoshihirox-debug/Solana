import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDB, useQK } from '../components/trading/useDB';
import { useLanguage } from '@/components/context/LanguageContext';
import StatCard from '../components/trading/StatCard';
import PnLChart from '../components/trading/PnLChart';
import TradeRow from '../components/trading/TradeRow';
import StatusIndicator from '../components/trading/StatusIndicator';
import { Wallet, TrendingUp, BarChart3, Target, Activity, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Dashboard() {
  const { t } = useLanguage();
  const db = useDB();
  const tradesQK = useQK('trades');
  const settingsQK = useQK('settings');

  const { data: trades = [] } = useQuery({
    queryKey: tradesQK,
    queryFn: () => db.SimulatedTrade.list('-created_date', 100),
  });

  const { data: settings = [] } = useQuery({
    queryKey: settingsQK,
    queryFn: () => db.TradingSettings.list(),
  });

  const isActive = settings.length > 0 && settings[0]?.is_active;
  const closedTrades = trades.filter(tr => tr.status === 'closed' || tr.status === 'stopped');
  const openTrades = trades.filter(tr => tr.status === 'open');

  const totalPnl = closedTrades.reduce((sum, tr) => sum + (tr.profit_loss_sol || 0), 0);
  const winRate = closedTrades.length > 0
    ? (closedTrades.filter(tr => (tr.profit_loss_sol || 0) > 0).length / closedTrades.length * 100)
    : 0;
  const totalInvested = closedTrades.reduce((sum, tr) => sum + (tr.amount_sol || 0), 0);
  const avgPnlPct = closedTrades.length > 0
    ? closedTrades.reduce((sum, tr) => sum + (tr.profit_loss_pct || 0), 0) / closedTrades.length
    : 0;

  const recentTrades = trades.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <StatusIndicator active={isActive} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('dashboard.total_pnl')} value={`${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(4)} SOL`} icon={Wallet} trend={avgPnlPct} />
        <StatCard title={t('dashboard.win_rate')} value={`${winRate.toFixed(1)}%`} icon={Target} subtitle={`${closedTrades.filter(tr => (tr.profit_loss_sol || 0) > 0).length}/${closedTrades.length} trades`} />
        <StatCard title={t('dashboard.total_trades')} value={trades.length} icon={BarChart3} subtitle={`${openTrades.length} open`} />
        <StatCard title={t('dashboard.total_volume')} value={`${totalInvested.toFixed(2)} SOL`} icon={Activity} subtitle={t('dashboard.capital')} />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">{t('dashboard.pnl_chart')}</h2>
          <span className={`text-sm font-mono font-bold ${totalPnl >= 0 ? 'text-primary glow-green' : 'text-destructive glow-red'}`}>
            {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(4)} SOL
          </span>
        </div>
        <PnLChart trades={trades} />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">{t('dashboard.recent_trades')}</h2>
          <Link to={createPageUrl("Trades")}>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
              {t('dashboard.see_all')} <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
        {recentTrades.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm font-mono">
            {t('dashboard.no_trades')}
          </div>
        ) : (
          <div className="space-y-2">
            {recentTrades.map(trade => (
              <TradeRow key={trade.id} trade={trade} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}