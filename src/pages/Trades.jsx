import React, { useState } from 'react';
import { useLanguage } from '@/components/context/LanguageContext';
import { useWallet } from '@/components/context/WalletContext';
import { useDB, useQK } from '../components/trading/useDB';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TradeRow from '../components/trading/TradeRow';
import PnLChart from '../components/trading/PnLChart';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Download, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export default function Trades() {
  const [filter, setFilter] = useState('all');
  const { t } = useLanguage();
  const { mode } = useWallet();
  const db = useDB();
  const queryClient = useQueryClient();
  const tradesQK = useQK('trades');

  const { data: trades = [] } = useQuery({
    queryKey: tradesQK,
    queryFn: () => db.SimulatedTrade.list('-created_date', 200),
  });

  const closeTradeM = useMutation({
    mutationFn: async (trade) => {
      const sellPrice = trade.buy_price * (1 + (Math.random() - 0.4) * 0.5);
      const pnlSol = (sellPrice - trade.buy_price) * (trade.tokens_bought || 0);
      const pnlPct = ((sellPrice - trade.buy_price) / trade.buy_price) * 100;
      await db.SimulatedTrade.update(trade.id, {
        status: "closed", sell_price: sellPrice,
        profit_loss_sol: parseFloat(pnlSol.toFixed(6)),
        profit_loss_pct: parseFloat(pnlPct.toFixed(2)),
        sell_timestamp: new Date().toISOString(),
      });
      await db.TradeLog.create({
        level: pnlSol > 0 ? "success" : "error",
        message: `Trade closed manually: ${pnlSol > 0 ? "GAIN" : "LOSS"} ${pnlSol.toFixed(4)} SOL`,
        token_symbol: trade.token_symbol, category: "trade",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tradesQK });
      queryClient.invalidateQueries({ queryKey: ['logs', mode] });
      toast.success(t('trades.closed'));
    },
  });

  const clearAllM = useMutation({
    mutationFn: async () => {
      for (const trade of trades) {
        await db.SimulatedTrade.delete(trade.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tradesQK });
      toast.success(t('trades.cleared'));
    },
  });

  const filteredTrades = trades.filter(tr => {
    if (filter === 'all') return true;
    if (filter === 'open') return tr.status === 'open';
    if (filter === 'wins') return tr.status !== 'open' && (tr.profit_loss_sol || 0) > 0;
    if (filter === 'losses') return tr.status !== 'open' && (tr.profit_loss_sol || 0) < 0;
    return true;
  });

  const closedTrades = trades.filter(tr => tr.status !== 'open');
  const totalPnl = closedTrades.reduce((s, tr) => s + (tr.profit_loss_sol || 0), 0);
  const wins = closedTrades.filter(tr => (tr.profit_loss_sol || 0) > 0).length;
  const losses = closedTrades.filter(tr => (tr.profit_loss_sol || 0) < 0).length;

  const exportCSV = () => {
    const headers = "Token,Symbol,Strategy,Buy,Sell,SOL,P&L SOL,P&L %,Status,Date\n";
    const rows = trades.map(tr =>
      `${tr.token_name},${tr.token_symbol},${tr.strategy},${tr.buy_price},${tr.sell_price || ''},${tr.amount_sol},${tr.profit_loss_sol || ''},${tr.profit_loss_pct || ''},${tr.status},${tr.created_date}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('trades.exported'));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{mode === 'real' ? t('trades.title_real') : t('trades.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {trades.length} trades · {wins}W / {losses}L · P&L:
            <span className={totalPnl >= 0 ? " text-primary" : " text-destructive"}>
              {' '}{totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(4)} SOL
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-3 h-3 mr-1" /> {t('trades.export')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => clearAllM.mutate()} disabled={clearAllM.isPending}
            className="text-destructive border-destructive/30 hover:bg-destructive/10">
            <Trash2 className="w-3 h-3 mr-1" /> {t('trades.delete')}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">{t('trades.chart')}</h2>
        </div>
        <PnLChart trades={trades} />
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="all" className="font-mono text-xs">{t('trades.all')} ({trades.length})</TabsTrigger>
          <TabsTrigger value="open" className="font-mono text-xs">{t('trades.open')} ({trades.filter(x => x.status === 'open').length})</TabsTrigger>
          <TabsTrigger value="wins" className="font-mono text-xs text-primary">{t('trades.wins')} ({wins})</TabsTrigger>
          <TabsTrigger value="losses" className="font-mono text-xs text-destructive">{t('trades.losses')} ({losses})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        {filteredTrades.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm font-mono">
            {t('trades.no_trades')}
          </div>
        ) : (
          filteredTrades.map(trade => (
            <TradeRow key={trade.id} trade={trade} onCloseTrade={(tr) => closeTradeM.mutate(tr)} />
          ))
        )}
      </div>
    </div>
  );
}