import React from 'react';
import { useWallet } from '@/components/context/WalletContext';
import { useLanguage } from '@/components/context/LanguageContext';
import { cn } from "@/lib/utils";
import { FlaskConical, Zap } from "lucide-react";

export default function ModeToggle({ onNeedWallet }) {
  const { wallet, mode, setMode } = useWallet();
  const { t } = useLanguage();

  const handleToggle = () => {
    if (mode === 'simulation') {
      if (!wallet) { onNeedWallet?.(); return; }
      setMode('real');
    } else {
      setMode('simulation');
    }
  };

  return (
    <button
      onClick={handleToggle}
      title={mode === 'real' ? 'Switch to Simulation' : 'Switch to Real (requires wallet)'}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border h-8",
        mode === 'real'
          ? "bg-destructive/15 text-destructive border-destructive/40 hover:bg-destructive/25 shadow-[0_0_8px_hsl(0_72%_55%/0.2)]"
          : "bg-secondary text-muted-foreground border-border hover:text-foreground"
      )}
    >
      {mode === 'real'
        ? <><Zap className="w-3 h-3" /> {t('mode.real')}</>
        : <><FlaskConical className="w-3 h-3" /> {t('mode.simulation')}</>
      }
    </button>
  );
}