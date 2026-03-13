import React from 'react';
import { useLanguage } from '@/components/context/LanguageContext';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

const LANGS = [
  { code: 'en', label: 'EN', flag: '🇺🇸', name: 'English' },
  { code: 'zh', label: '中文', flag: '🇨🇳', name: '中文' },
];

export default function LanguageSelector() {
  const { lang, changeLang } = useLanguage();
  const current = LANGS.find(l => l.code === lang) || LANGS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 font-mono text-xs h-8 px-2.5">
          <Globe className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{current.flag}</span>
          <span className="hidden sm:inline">{current.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border-border min-w-[130px]">
        {LANGS.map(l => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => changeLang(l.code)}
            className={`font-mono text-sm cursor-pointer gap-2 ${lang === l.code ? 'text-primary' : ''}`}
          >
            <span>{l.flag}</span>
            <span>{l.name}</span>
            {lang === l.code && <span className="ml-auto text-primary text-xs">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}