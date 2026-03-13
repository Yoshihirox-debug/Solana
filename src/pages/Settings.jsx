import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/components/context/LanguageContext';
import { useDB, useQK } from '../components/trading/useDB';
import SafeModePanel from '../components/trading/SafeModePanel';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DEFAULT_SETTINGS } from '../components/trading/SimulationEngine';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, RotateCcw, Shield, Target, Wallet, BarChart3, Clock, Layers, Zap } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const { t } = useLanguage();
  const db = useDB();
  const queryClient = useQueryClient();
  const settingsQK = useQK('settings');

  const STRATEGIES = [
    { id: "quick_flip",   label: "Quick Flip",   descKey: "strat.quick_flip.desc",   icon: Zap },
    { id: "momentum",     label: "Momentum",     descKey: "strat.momentum.desc",     icon: BarChart3 },
    { id: "dip_buy",      label: "Dip Buy",      descKey: "strat.dip_buy.desc",      icon: Target },
    { id: "volume_spike", label: "Volume Spike", descKey: "strat.volume_spike.desc", icon: Layers },
  ];

  const { data: settings = [] } = useQuery({
    queryKey: settingsQK,
    queryFn: () => db.TradingSettings.list(),
  });

  useEffect(() => {
    if (settings.length > 0) setForm(settings[0]);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (settings.length > 0) {
        await db.TradingSettings.update(settings[0].id, data);
      } else {
        await db.TradingSettings.create(data);
      }
      await db.TradeLog.create({
        level: "info", message: t('settings.updated_log'), details: JSON.stringify(data), category: "system",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQK });
      toast.success(t('settings.saved'));
    },
  });

  const handleStrategyToggle = (strategyId) => {
    const current = form.strategies_enabled || [];
    const updated = current.includes(strategyId) ? current.filter(s => s !== strategyId) : [...current, strategyId];
    setForm({ ...form, strategies_enabled: updated });
  };

  const resetDefaults = () => {
    setForm(DEFAULT_SETTINGS);
    toast.info(t('settings.reset_done'));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('settings.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetDefaults}>
            <RotateCcw className="w-3 h-3 mr-1" /> {t('settings.reset')}
          </Button>
          <Button size="sm" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="bg-primary text-primary-foreground">
            <Save className="w-3 h-3 mr-1" /> {t('settings.save')}
          </Button>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Zap className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="font-semibold">{t('settings.active_label')}</p>
                <p className="text-xs text-muted-foreground">{t('settings.active_desc2')}</p>
              </div>
            </div>
            <Switch checked={!!form.is_active} onCheckedChange={(checked) => setForm({...form, is_active: checked})} />
          </div>
        </CardContent>
      </Card>

      {/* Safe Mode */}
      <SafeModePanel />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Wallet className="w-4 h-4 text-primary" /> {t('settings.trade_params_title')}</CardTitle>
            <CardDescription>{t('settings.trade_params_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase tracking-wider">{t('settings.investment')}</Label>
              <div className="flex items-center gap-3">
                <Slider value={[form.investment_per_trade_sol]} onValueChange={([v]) => setForm({...form, investment_per_trade_sol: v})} min={0.1} max={5} step={0.1} className="flex-1" />
                <Badge variant="outline" className="font-mono min-w-[60px] justify-center">{form.investment_per_trade_sol} SOL</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase tracking-wider">{t('settings.max_trades')}</Label>
              <div className="flex items-center gap-3">
                <Slider value={[form.max_open_trades]} onValueChange={([v]) => setForm({...form, max_open_trades: v})} min={1} max={20} step={1} className="flex-1" />
                <Badge variant="outline" className="font-mono min-w-[40px] justify-center">{form.max_open_trades}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase tracking-wider flex items-center gap-2"><Clock className="w-3 h-3" /> {t('settings.auto_sell')}</Label>
              <Input type="number" value={form.auto_sell_after_minutes} onChange={(e) => setForm({...form, auto_sell_after_minutes: parseInt(e.target.value) || 60})} className="bg-secondary border-border font-mono" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4 text-accent" /> {t('settings.risk_title')}</CardTitle>
            <CardDescription>{t('settings.risk_desc2')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase tracking-wider text-destructive">{t('settings.stop_loss')}</Label>
              <div className="flex items-center gap-3">
                <Slider value={[form.stop_loss_pct]} onValueChange={([v]) => setForm({...form, stop_loss_pct: v})} min={5} max={50} step={1} className="flex-1" />
                <Badge variant="outline" className="font-mono min-w-[50px] justify-center text-destructive border-destructive/30">-{form.stop_loss_pct}%</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase tracking-wider text-primary">{t('settings.take_profit')}</Label>
              <div className="flex items-center gap-3">
                <Slider value={[form.take_profit_pct]} onValueChange={([v]) => setForm({...form, take_profit_pct: v})} min={10} max={500} step={5} className="flex-1" />
                <Badge variant="outline" className="font-mono min-w-[50px] justify-center text-primary border-primary/30">+{form.take_profit_pct}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4 text-chart-3" /> {t('settings.filters_title')}</CardTitle>
            <CardDescription>{t('settings.filters_desc2')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'min_liquidity_sol', labelKey: 'settings.min_liq', type: 'float' },
              { key: 'min_volume_24h',    labelKey: 'settings.min_vol', type: 'float' },
              { key: 'max_market_cap',    labelKey: 'settings.max_mcap', type: 'float' },
              { key: 'min_holders',       labelKey: 'settings.min_holders', type: 'int' },
            ].map(({ key, labelKey, type }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs font-mono uppercase tracking-wider">{t(labelKey)}</Label>
                <Input type="number" value={form[key]} onChange={(e) => setForm({...form, [key]: type === 'int' ? parseInt(e.target.value) || 0 : parseFloat(e.target.value) || 0})} className="bg-secondary border-border font-mono" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4 text-chart-4" /> {t('settings.strategies_title')}</CardTitle>
            <CardDescription>{t('settings.strategies_desc2')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {STRATEGIES.map(strat => {
              const enabled = (form.strategies_enabled || []).includes(strat.id);
              const Icon = strat.icon;
              return (
                <div key={strat.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${enabled ? 'border-primary/30 bg-primary/5' : 'border-border bg-secondary/30'}`}
                  onClick={() => handleStrategyToggle(strat.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Icon className={`w-3.5 h-3.5 ${enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{strat.label}</p>
                      <p className="text-xs text-muted-foreground">{t(strat.descKey)}</p>
                    </div>
                  </div>
                  <Switch checked={enabled} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}