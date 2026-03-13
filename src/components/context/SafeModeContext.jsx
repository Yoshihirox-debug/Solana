import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { generateMemecoins, evaluateToken, simulateTrade } from '../trading/SimulationEngine';
import { localDB } from '../trading/localDB';

import { useWallet } from './WalletContext';

const SafeModeContext = createContext(null);

// Conservative settings for Safe Mode: small TP/SL for consistent gains
const SAFE_SETTINGS = {
  investment_per_trade_sol: 0.2,
  stop_loss_pct: 8,
  take_profit_pct: 20,
  min_liquidity_sol: 15,
  min_volume_24h: 2000,
  max_market_cap: 300000,
  min_holders: 80,
  auto_sell_after_minutes: 30,
  max_open_trades: 3,
  strategies_enabled: ['quick_flip', 'momentum'],
};

const SCAN_INTERVAL_MS = 30000; // scan every 30s

export function SafeModeProvider({ children }) {
  const [isRunning, setIsRunning] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [tradesCount, setTradesCount] = useState(0);
  const [totalPnl, setTotalPnl] = useState(0);
  const startTimeRef = useRef(null);
  const scanTimerRef = useRef(null);
  const tickTimerRef = useRef(null);
  const { mode } = useWallet();

  const db = mode === 'simulation' ? localDB : db.entities;

  const runScan = useCallback(async () => {
    const tokens = generateMemecoins(20);
    const eligible = tokens.filter(t => evaluateToken(t, SAFE_SETTINGS).eligible);
    const toTrade = eligible.slice(0, SAFE_SETTINGS.max_open_trades);

    let sessionPnl = 0;
    let count = 0;
    for (const token of toTrade) {
      const result = simulateTrade(token, SAFE_SETTINGS);
      await db.SimulatedTrade.create(result);
      await db.TradeLog.create({
        level: result.profit_loss_sol > 0 ? 'success' : 'warning',
        message: `[SAFE MODE] ${result.token_symbol}: ${result.profit_loss_sol >= 0 ? '+' : ''}${result.profit_loss_sol.toFixed(4)} SOL (${result.profit_loss_pct.toFixed(1)}%)`,
        token_symbol: result.token_symbol,
        category: 'strategy',
      });
      sessionPnl += result.profit_loss_sol;
      count++;
    }
    setTradesCount(prev => prev + count);
    setTotalPnl(prev => prev + sessionPnl);
  }, [db]);

  const start = useCallback((durationMinutes) => {
    const ms = durationMinutes * 60 * 1000;
    setDurationMs(ms);
    setElapsedMs(0);
    setTradesCount(0);
    setTotalPnl(0);
    setIsRunning(true);
    startTimeRef.current = Date.now();
  }, []);

  const stop = useCallback(async () => {
    setIsRunning(false);
    clearInterval(scanTimerRef.current);
    clearInterval(tickTimerRef.current);
    scanTimerRef.current = null;
    tickTimerRef.current = null;
    await db.TradeLog.create({
      level: 'info',
      message: `[SAFE MODE] Session terminée. Trades: ${tradesCount}`,
      category: 'system',
    });
  }, [db, tradesCount]);

  useEffect(() => {
    if (!isRunning) return;

    // Immediate first scan
    runScan();
    scanTimerRef.current = setInterval(runScan, SCAN_INTERVAL_MS);
    tickTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setElapsedMs(elapsed);
      if (elapsed >= durationMs) {
        stop();
      }
    }, 1000);

    return () => {
      clearInterval(scanTimerRef.current);
      clearInterval(tickTimerRef.current);
    };
  }, [isRunning]);

  const remainingMs = Math.max(0, durationMs - elapsedMs);
  const progress = durationMs > 0 ? Math.min(100, (elapsedMs / durationMs) * 100) : 0;

  return (
    <SafeModeContext.Provider value={{ isRunning, start, stop, remainingMs, progress, tradesCount, totalPnl, SAFE_SETTINGS }}>
      {children}
    </SafeModeContext.Provider>
  );
}

export const useSafeMode = () => useContext(SafeModeContext);