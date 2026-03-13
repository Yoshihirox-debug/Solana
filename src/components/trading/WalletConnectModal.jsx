import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useWallet } from '@/components/context/WalletContext';
import { useLanguage } from '@/components/context/LanguageContext';
import { cn } from "@/lib/utils";
import { CheckCircle2, ExternalLink, Loader2, Wallet, Copy, LogOut } from "lucide-react";
import { toast } from "sonner";

const WALLETS = [
  {
    id: 'phantom', name: 'Phantom', desc: 'Most popular Solana wallet',
    color: 'from-purple-500 to-purple-700', initials: 'PH',
    detect: () => typeof window !== 'undefined' && !!(window?.phantom?.solana || window?.solana?.isPhantom),
  },
  {
    id: 'solflare', name: 'Solflare', desc: 'Secure multi-platform wallet',
    color: 'from-orange-400 to-orange-600', initials: 'SF',
    detect: () => typeof window !== 'undefined' && !!window?.solflare?.isSolflare,
  },
  {
    id: 'backpack', name: 'Backpack', desc: 'xNFT wallet by Coral',
    color: 'from-zinc-500 to-zinc-700', initials: 'BP',
    detect: () => typeof window !== 'undefined' && !!window?.backpack,
  },
  {
    id: 'glow', name: 'Glow', desc: 'Native Solana wallet',
    color: 'from-yellow-400 to-yellow-600', initials: 'GL',
    detect: () => false,
  },
];

const OTHER_WALLETS = [
  {
    id: 'metamask', name: 'MetaMask', desc: 'Most popular EVM wallet',
    color: 'from-orange-400 to-orange-500', initials: 'MM',
    detect: () => typeof window !== 'undefined' && !!window?.ethereum?.isMetaMask,
  },
  {
    id: 'trust', name: 'Trust Wallet', desc: 'Multi-chain mobile wallet',
    color: 'from-blue-500 to-blue-600', initials: 'TW',
    detect: () => false,
  },
  {
    id: 'coinbase', name: 'Coinbase Wallet', desc: 'By Coinbase exchange',
    color: 'from-blue-400 to-blue-500', initials: 'CB',
    detect: () => typeof window !== 'undefined' && !!window?.coinbaseWalletExtension,
  },
  {
    id: 'walletconnect', name: 'WalletConnect', desc: 'Connect any mobile wallet',
    color: 'from-cyan-500 to-cyan-600', initials: 'WC',
    detect: () => false,
  },
];

function WalletBtn({ w, connecting, onConnect, t }) {
  const isInstalled = w.detect();
  const isConnecting = connecting === w.id;

  return (
    <button
      onClick={() => onConnect(w.id)}
      disabled={!!connecting}
      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-secondary/60 transition-all disabled:opacity-50 group"
    >
      <div className={cn(`w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-xs shrink-0`, w.color)}>
        {w.initials}
      </div>
      <div className="text-left flex-1 min-w-0">
        <p className="text-sm font-semibold">{w.name}</p>
        <p className="text-xs text-muted-foreground truncate">{w.desc}</p>
      </div>
      {isConnecting ? (
        <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
      ) : isInstalled ? (
        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary shrink-0">{t('wallet.installed')}</Badge>
      ) : (
        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-all" />
      )}
    </button>
  );
}

export default function WalletConnectModal({ open, onOpenChange }) {
  const { connect, wallet, disconnect } = useWallet();
  const { t } = useLanguage();
  const [connecting, setConnecting] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleConnect = async (walletId) => {
    setConnecting(walletId);
    await new Promise(r => setTimeout(r, 900 + Math.random() * 600));
    await connect(walletId);
    setConnecting(null);
    onOpenChange(false);
    toast.success(`Wallet connected!`);
  };

  const handleCopy = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    onOpenChange(false);
    toast.info("Wallet disconnected");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            {t('wallet.modal_title')}
          </DialogTitle>
          {!wallet && <p className="text-xs text-muted-foreground mt-1">{t('wallet.modal_subtitle')}</p>}
        </DialogHeader>

        {wallet ? (
          <div className="space-y-4">
            {/* Connected state */}
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
              <div className="flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-xs shrink-0",
                  wallet.color || 'from-primary/50 to-primary'
                )}>
                  {wallet.name?.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    <p className="text-sm font-semibold">{wallet.name}</p>
                    {wallet.real && <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Real</Badge>}
                  </div>
                  <p className="text-xs font-mono text-muted-foreground truncate">{wallet.address}</p>
                </div>
              </div>
              <div className="flex items-center justify-between px-1">
                <div>
                  <p className="text-[10px] text-muted-foreground">{t('wallet.balance')}</p>
                  <p className="text-sm font-bold font-mono">{wallet.balance} SOL</p>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-all px-2 py-1 rounded-md hover:bg-secondary"
                >
                  <Copy className="w-3 h-3" />
                  {copied ? t('wallet.copied') : t('wallet.copy')}
                </button>
              </div>
            </div>

            <button
              onClick={handleDisconnect}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-destructive/30 text-destructive text-sm hover:bg-destructive/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              {t('wallet.disconnect')}
            </button>
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-0.5">{t('wallet.solana')}</p>
              {WALLETS.map(w => (
                <WalletBtn key={w.id} w={w} connecting={connecting} onConnect={handleConnect} t={t} />
              ))}
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-0.5">{t('wallet.other')}</p>
              {OTHER_WALLETS.map(w => (
                <WalletBtn key={w.id} w={w} connecting={connecting} onConnect={handleConnect} t={t} />
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}