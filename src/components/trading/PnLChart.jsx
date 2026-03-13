import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import moment from 'moment';

export default function PnLChart({ trades }) {
  const closedTrades = trades
    .filter(t => t.status === 'closed' || t.status === 'stopped')
    .sort((a, b) => new Date(a.sell_timestamp || a.created_date) - new Date(b.sell_timestamp || b.created_date));

  let cumulative = 0;
  const data = closedTrades.map((trade, i) => {
    cumulative += trade.profit_loss_sol || 0;
    return {
      name: moment(trade.sell_timestamp || trade.created_date).format('DD/MM HH:mm'),
      pnl: parseFloat(cumulative.toFixed(4)),
      trade: trade.token_symbol,
    };
  });

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm font-mono">
        Aucun trade fermé pour afficher le graphique
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
        <p className="text-xs text-muted-foreground font-mono">{label}</p>
        <p className={`text-sm font-bold font-mono ${payload[0].value >= 0 ? 'text-primary' : 'text-destructive'}`}>
          {payload[0].value >= 0 ? '+' : ''}{payload[0].value} SOL
        </p>
        <p className="text-xs text-muted-foreground">{payload[0].payload.trade}</p>
      </div>
    );
  };

  const minVal = Math.min(...data.map(d => d.pnl));
  const maxVal = Math.max(...data.map(d => d.pnl));
  const isPositive = data[data.length - 1]?.pnl >= 0;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={isPositive ? "hsl(142, 72%, 50%)" : "hsl(0, 72%, 55%)"} stopOpacity={0.3} />
            <stop offset="95%" stopColor={isPositive ? "hsl(142, 72%, 50%)" : "hsl(0, 72%, 55%)"} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(215, 14%, 50%)' }} />
        <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 14%, 50%)' }} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="pnl"
          stroke={isPositive ? "hsl(142, 72%, 50%)" : "hsl(0, 72%, 55%)"}
          fill="url(#pnlGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}