import React, { useState } from 'react';
import { useLanguage } from '@/components/context/LanguageContext';
import { useDB, useQK } from '../components/trading/useDB';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LogEntry from '../components/trading/LogEntry';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Download, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

export default function Logs() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { t } = useLanguage();
  const db = useDB();
  const queryClient = useQueryClient();
  const logsQK = useQK('logs');

  const { data: logs = [], refetch } = useQuery({
    queryKey: logsQK,
    queryFn: () => db.TradeLog.list('-created_date', 200),
    refetchInterval: 5000,
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      for (const log of logs) {
        await db.TradeLog.delete(log.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logsQK });
      toast.success(t('logs.cleared'));
    },
  });

  const exportLogs = () => {
    const text = logs.map(l => `[${l.created_date}] [${l.level?.toUpperCase()}] ${l.token_symbol ? `[${l.token_symbol}]` : ''} ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(log => {
    const levelMatch = filter === 'all' || log.level === filter;
    const searchMatch = !search || log.message?.toLowerCase().includes(search.toLowerCase()) || log.token_symbol?.toLowerCase().includes(search.toLowerCase());
    return levelMatch && searchMatch;
  });

  const levelCounts = logs.reduce((acc, l) => { acc[l.level] = (acc[l.level] || 0) + 1; return acc; }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('logs.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{logs.length} {t('logs.entries')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-3 h-3 mr-1" /> {t('logs.refresh')}
          </Button>
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="w-3 h-3 mr-1" /> {t('logs.export')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => clearMutation.mutate()} disabled={clearMutation.isPending}
            className="text-destructive border-destructive/30 hover:bg-destructive/10">
            <Trash2 className="w-3 h-3 mr-1" /> {t('logs.clear')}
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder={t('logs.search')} value={search} onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card border-border font-mono text-sm" />
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="bg-secondary flex-wrap h-auto">
          <TabsTrigger value="all" className="font-mono text-xs">{t('logs.all')} <Badge variant="outline" className="ml-1 text-[10px]">{logs.length}</Badge></TabsTrigger>
          <TabsTrigger value="success" className="font-mono text-xs">{t('logs.success')} <Badge variant="outline" className="ml-1 text-[10px]">{levelCounts.success || 0}</Badge></TabsTrigger>
          <TabsTrigger value="error" className="font-mono text-xs">{t('logs.errors')} <Badge variant="outline" className="ml-1 text-[10px]">{levelCounts.error || 0}</Badge></TabsTrigger>
          <TabsTrigger value="warning" className="font-mono text-xs">{t('logs.alerts')} <Badge variant="outline" className="ml-1 text-[10px]">{levelCounts.warning || 0}</Badge></TabsTrigger>
          <TabsTrigger value="info" className="font-mono text-xs">{t('logs.info')} <Badge variant="outline" className="ml-1 text-[10px]">{levelCounts.info || 0}</Badge></TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-1 rounded-xl border border-border bg-card p-3 max-h-[600px] overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm font-mono">{t('logs.no_logs')}</div>
        ) : (
          filteredLogs.map(log => <LogEntry key={log.id} log={log} />)
        )}
      </div>
    </div>
  );
}