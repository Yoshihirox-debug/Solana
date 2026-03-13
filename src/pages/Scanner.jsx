import React, { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { generateMemecoins, simulateTrade, evaluateToken, DEFAULT_SETTINGS } from '../components/trading/SimulationEngine';
import { useDB, useQK } from '../components/trading/useDB';
import { useLanguage } from '@/components/context/LanguageContext';
import { useWallet } from '@/components/context/WalletContext';
import RiskAnalysisModal from '../components/trading/RiskAnalysisModal';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { RefreshCw, Search, Zap, Filter, Play, Loader2, TrendingUp, TrendingDown, Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

function TokenCard({ token, onSimulate, onTrade, onRisk, mode }) {
  const { t } = useLanguage();
  const priceChange = token.price_change_pct || 0;
  const isUp = priceChange > 0;

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-border/50 bg-card/50 hover:bg-secondary/50 hover:border-primary/20 transition-all group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent/40 to-primary/40 flex items-center justify-center text-xs font-bold font-mono shrink-0">
          {token.symbol?.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{token.name}</p>
          <p className="text-xs text-muted-foreground font-mono">${token.symbol}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-xs text-muted-foreground font-mono">{t('scanner.price')}</p>
          <p className="text-sm font-mono font-semibold">${token.price?.toFixed(8)}</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-xs text-muted-foreground font-mono">{t('scanner.vol')}</p>
          <p className="text-sm font-mono">${(token.volume_24h || 0).toLocaleString()}</p>
        </div>
        <div className="text-right hidden lg:block">
          <p className="text-xs text-muted-foreground font-mono">{t('scanner.mcap')}</p>
          <p className="text-sm font-mono">${(token.market_cap || 0).toLocaleString()}</p>
        </div>
        <div className={cn("flex items-center gap-1 min-w-[70px] justify-end font-mono text-sm font-semibold",
          isUp ? "text-primary" : "text-destructive"
        )}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isUp ? "+" : ""}{priceChange.toFixed(1)}%
        </div>

        {token.is_hot && (
          <Badge variant="outline" className="border-chart-3 text-chart-3 text-xs gap-1 hidden sm:flex">
            <Zap className="w-3 h-3" /> Hot
          </Badge>
        )}

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-accent/30 text-accent hover:bg-accent/10"
            onClick={() => onRisk(token)}>
            <Shield className="w-3 h-3 mr-1" />{t('scanner.analyze')}
          </Button>
          {mode === 'real' ? (
            <Button size="sm" className="h-7 px-2 text-xs bg-destructive/80 hover:bg-destructive text-white"
              onClick={() => onTrade(token)}>
              <Zap className="w-3 h-3 mr-1" />{t('scanner.trade')}
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={() => onSimulate(token)}>
              <Play className="w-3 h-3 mr-1" />{t('scanner.simulate')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Scanner() {
  const [tokens, setTokens] = useState([]);
  const [search, setSearch] = useState('');
  const [filterHot, setFilterHot] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [autoScan, setAutoScan] = useState(false);
  const [riskToken, setRiskToken] = useState(null);
  const { t } = useLanguage();
  const { mode, wallet } = useWallet();
  const db = useDB();
  const queryClient = useQueryClient();

  const settingsQK = useQK('settings');
  const { data: settings = [] } = useQuery({
    queryKey: settingsQK,
    queryFn: () => db.TradingSettings.list(),
  });

  const currentSettings = settings.length > 0 ? settings[0] : DEFAULT_SETTINGS;

  const scan = useCallback(() => {
    setIsScanning(true);
    setTimeout(() => { setTokens(generateMemecoins(15)); setIsScanning(false); }, 800);
  }, []);

  useEffect(() => { scan(); }, [scan]);

  useEffect(() => {
    if (!autoScan) return;
    const interval = setInterval(scan, 10000);
    return () => clearInterval(interval);
  }, [autoScan, scan]);

  // Guard: real mode requires wallet
  const canTrade = mode === 'simulation' || (mode === 'real' && !!wallet);

  const doTrade = async (token) => {
    // Guard: real mode requires wallet
    if (mode === 'real' && !wallet) {
      toast.error('Wallet requis pour le mode réel');
      return;
    }
    const result = simulateTrade(token, currentSettings);
    await db.SimulatedTrade.create(result);
    await db.TradeLog.create({
      level: result.profit_loss_sol > 0 ? "success" : "error",
      message: `[${mode === 'real' ? 'REAL' : 'SIM'}] ${result.profit_loss_sol > 0 ? 'GAIN' : 'LOSS'} ${result.profit_loss_sol.toFixed(4)} SOL (${result.profit_loss_pct.toFixed(1)}%)`,
      token_symbol: token.symbol, category: "trade",
    });
    return result;
  };

  const tradeMutation = useMutation({
    mutationFn: doTrade,
    onSuccess: (result) => {
      if (!result) return;
      queryClient.invalidateQueries({ queryKey: ['trades', mode] });
      queryClient.invalidateQueries({ queryKey: ['logs', mode] });
      const isProfit = result.profit_loss_sol > 0;
      toast[isProfit ? 'success' : 'error'](
        `${result.token_symbol}: ${isProfit ? '+' : ''}${result.profit_loss_sol.toFixed(4)} SOL (${result.profit_loss_pct.toFixed(1)}%)`,
        { description: result.stop_loss_triggered ? "Stop-loss triggered" : result.take_profit_triggered ? "Take-profit triggered" : result.strategy }
      );
    },
  });

  const simulateAllEligible = () => {
    if (mode === 'real' && !wallet) {
      toast.error('Wallet requis pour le mode réel');
      return;
    }
    const eligible = tokens.filter(tok => evaluateToken(tok, currentSettings).eligible);
    const toTrade = eligible.slice(0, currentSettings.max_open_trades || 5);
    toTrade.forEach(token => tradeMutation.mutate(token));
  };

  const filteredTokens = tokens
    .filter(tok => !search || tok.name.toLowerCase().includes(search.toLowerCase()) || tok.symbol.toLowerCase().includes(search.toLowerCase()))
    .filter(tok => !filterHot || tok.is_hot)
    .sort((a, b) => b.price_change_pct - a.price_change_pct);

  const eligibleCount = tokens.filter(tok => evaluateToken(tok, currentSettings).eligible).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('scanner.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tokens.length} {t('scanner.detected')} · {eligibleCount} {t('scanner.eligible')}
            {mode === 'real' && (
              <span className="ml-2 text-destructive font-semibold font-mono text-xs">⚡ REAL MODE</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAutoScan(!autoScan)}
            className={autoScan ? "border-primary text-primary" : ""}>
            <Zap className="w-3 h-3 mr-1" /> {autoScan ? t('scanner.stop') : t('scanner.auto')}
          </Button>
          <Button variant="outline" size="sm" onClick={scan} disabled={isScanning}>
            <RefreshCw className={`w-3 h-3 mr-1 ${isScanning ? 'animate-spin' : ''}`} /> {t('scanner.scan')}
          </Button>
          <Button size="sm" onClick={simulateAllEligible} disabled={tradeMutation.isPending || !canTrade}
            className={cn("text-xs font-semibold", mode === 'real'
              ? "bg-destructive text-white hover:bg-destructive/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}>
            {tradeMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Play className="w-3 h-3 mr-1" />}
            {mode === 'real' ? t('scanner.trade_all') : t('scanner.simulate_all')}
          </Button>
        </div>
      </div>

      {/* Real mode warning */}
      {mode === 'real' && wallet && (
        <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/5 flex items-center gap-3">
          <Zap className="w-4 h-4 text-destructive shrink-0" />
          <div>
            <p className="text-sm font-semibold text-destructive">Real Trading Mode Active</p>
            <p className="text-xs text-muted-foreground">Connected: {wallet.address?.slice(0, 8)}...{wallet.address?.slice(-6)} · {wallet.balance} SOL</p>
          </div>
          <Badge variant="outline" className="ml-auto border-destructive/30 text-destructive text-xs font-mono">LIVE</Badge>
        </div>
      )}

      {/* Real mode without wallet guard */}
      {mode === 'real' && !wallet && (
        <div className="p-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
          <p className="text-sm text-yellow-500 font-semibold">Wallet requis pour trader en mode réel. Connectez un wallet ou passez en mode Simulation.</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t('scanner.search')} value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border font-mono text-sm" />
        </div>
        <Button variant={filterHot ? "default" : "outline"} size="sm" onClick={() => setFilterHot(!filterHot)}
          className={filterHot ? "bg-chart-3/20 text-chart-3 border-chart-3/30 hover:bg-chart-3/30" : ""}>
          <Filter className="w-3 h-3 mr-1" /> {t('scanner.hot_only')}
        </Button>
        <Badge variant="outline" className="text-xs font-mono">{filteredTokens.length} {t('scanner.results')}</Badge>
      </div>

      <div className="space-y-2">
        {isScanning && tokens.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-3" />
            <p className="text-sm text-muted-foreground font-mono">{t('scanner.scanning')}</p>
          </div>
        ) : (
          filteredTokens.map((token, i) => (
            <TokenCard
              key={`${token.symbol}-${i}`}
              token={token}
              mode={mode}
              onSimulate={(tok) => tradeMutation.mutate(tok)}
              onTrade={(tok) => {
                if (!wallet) { toast.error('Wallet requis'); return; }
                tradeMutation.mutate(tok);
              }}
              onRisk={(tok) => setRiskToken(tok)}
            />
          ))
        )}
      </div>

      <RiskAnalysisModal
        token={riskToken}
        open={!!riskToken}
        onOpenChange={(v) => { if (!v) setRiskToken(null); }}
        onTradeAnyway={(tok) => {
          if (mode === 'real' && !wallet) { toast.error('Wallet requis'); return; }
          tradeMutation.mutate(tok);
        }}
      />
    </div>
  );
}