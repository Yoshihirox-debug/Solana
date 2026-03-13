import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";
import { LanguageProvider, useLanguage } from '@/components/context/LanguageContext';
import { WalletProvider, useWallet } from '@/components/context/WalletContext';
import { SafeModeProvider, useSafeMode } from '@/components/context/SafeModeContext';
import LanguageSelector from '@/components/trading/LanguageSelector';
import ModeToggle from '@/components/trading/ModeToggle';
import WalletConnectModal from '@/components/trading/WalletConnectModal';
import {
  LayoutDashboard, Radar, ArrowLeftRight, Settings,
  ScrollText, FileBarChart, Menu, X, Hexagon, Wallet, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";

const isLocal = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);

function LayoutInner({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletModal, setWalletModal] = useState(false);
  const { t } = useLanguage();
  const { wallet, mode } = useWallet();
  const { isRunning: safeModeRunning, totalPnl: safePnl } = useSafeMode();

  const NAV_ITEMS = [
    { nameKey: "nav.dashboard", icon: LayoutDashboard, page: "Dashboard" },
    { nameKey: "nav.scanner", icon: Radar, page: "Scanner" },
    { nameKey: "nav.trades", icon: ArrowLeftRight, page: "Trades" },
    { nameKey: "nav.reports", icon: FileBarChart, page: "Reports" },
    { nameKey: "nav.logs", icon: ScrollText, page: "Logs" },
    { nameKey: "nav.settings", icon: Settings, page: "Settings" },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 lg:relative lg:translate-x-0 flex flex-col",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border shrink-0">
          <div className="p-2 rounded-lg bg-primary/10">
            <Hexagon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight">Solana Memecoin</h1>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Simulator</p>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden ml-auto" onClick={() => setMobileOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Local dev badge */}
        {isLocal && (
          <div className="mx-3 mt-3 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2 border bg-chart-3/10 border-chart-3/30 text-chart-3 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-chart-3" />
            💻 LOCAL DEV
          </div>
        )}

        {/* Mode indicator */}
        <div className={cn(
          "mx-3 mt-3 px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2 border shrink-0",
          mode === 'real'
            ? "bg-destructive/10 border-destructive/30 text-destructive"
            : "bg-primary/5 border-primary/20 text-primary"
        )}>
          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse-glow", mode === 'real' ? "bg-destructive" : "bg-primary")} />
          {mode === 'real' ? t('nav.real_mode') : t('nav.simulation_mode')}
        </div>

        {/* Safe mode indicator */}
        {safeModeRunning && (
          <div className="mx-3 mt-2 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2 border bg-primary/10 border-primary/30 text-primary shrink-0 animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
            🛡 {t('safe.sidebar')} · {safePnl >= 0 ? '+' : ''}{safePnl.toFixed(4)} SOL
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = currentPageName === item.page;
            const Icon = item.icon;
            return (
              <Link key={item.page} to={createPageUrl(item.page)} onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}>
                <Icon className={cn("w-4 h-4", isActive && "text-primary")} />
                {t(item.nameKey)}
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-border shrink-0 space-y-2">
          <p className="text-[9px] font-mono text-muted-foreground/40 text-center tracking-wide">
            {t('madeby')}
          </p>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="hidden lg:flex items-center gap-2">
            <Hexagon className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm">Solana Memecoin</span>
          </div>
          <div className="flex-1" />

          {/* Top-right controls */}
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ModeToggle onNeedWallet={() => setWalletModal(true)} />
            <button
              onClick={() => setWalletModal(true)}
              className={cn(
                "flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-mono font-semibold transition-all border",
                wallet
                  ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                  : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              )}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline max-w-[90px] truncate">
                {wallet ? wallet.address.slice(0, 4) + "..." + wallet.address.slice(-4) : t('wallet.connect')}
              </span>
              {wallet && <span className="text-[10px] opacity-70">{wallet.balance} SOL</span>}
            </button>
          </div>
        </header>

        <div className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      <WalletConnectModal open={walletModal} onOpenChange={setWalletModal} />
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <LanguageProvider>
      <WalletProvider>
        <SafeModeProvider>
          <LayoutInner currentPageName={currentPageName}>{children}</LayoutInner>
        </SafeModeProvider>
      </WalletProvider>
    </LanguageProvider>
  );
}