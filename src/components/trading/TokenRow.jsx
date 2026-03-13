import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Play, TrendingUp, TrendingDown, Zap } from "lucide-react";

export default function TokenRow({ token, onSimulateBuy }) {
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
      
      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block">
          <p className="text-xs text-muted-foreground font-mono">Prix</p>
          <p className="text-sm font-mono font-semibold">${token.price?.toFixed(8)}</p>
        </div>
        
        <div className="text-right hidden md:block">
          <p className="text-xs text-muted-foreground font-mono">Vol 24h</p>
          <p className="text-sm font-mono">${(token.volume_24h || 0).toLocaleString()}</p>
        </div>
        
        <div className="text-right hidden lg:block">
          <p className="text-xs text-muted-foreground font-mono">MCap</p>
          <p className="text-sm font-mono">${(token.market_cap || 0).toLocaleString()}</p>
        </div>
        
        <div className={cn(
          "flex items-center gap-1 min-w-[80px] justify-end font-mono text-sm font-semibold",
          isUp ? "text-primary" : "text-destructive"
        )}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isUp ? "+" : ""}{priceChange.toFixed(1)}%
        </div>
        
        <div className="flex items-center gap-2">
          {token.is_hot && (
            <Badge variant="outline" className="border-chart-3 text-chart-3 text-xs gap-1">
              <Zap className="w-3 h-3" /> Hot
            </Badge>
          )}
          <Button 
            size="sm" 
            variant="outline" 
            className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground opacity-0 group-hover:opacity-100 transition-all"
            onClick={() => onSimulateBuy(token)}
          >
            <Play className="w-3 h-3 mr-1" /> Simuler
          </Button>
        </div>
      </div>
    </div>
  );
}