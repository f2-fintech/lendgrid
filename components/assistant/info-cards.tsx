'use client';

import React from 'react';
import { Layers } from 'lucide-react';

export interface InfoCardItem {
  title: string;
  badge?: string;
  subtitle?: string;
  metrics: Array<{ label: string; value: string }>;
}

export interface InfoCardsData {
  title?: string;
  cards: InfoCardItem[];
}

export function InfoCards({ data }: { data: InfoCardsData }) {
  if (!data?.cards?.length) return null;

  return (
    <div className="mt-2 w-full max-w-[345px] space-y-2.5 text-xs">
      {data.title && (
        <div className="flex items-center gap-1.5 px-1 text-[11px] font-semibold text-muted-foreground">
          <Layers className="w-3.5 h-3.5 text-blue-fixed dark:text-blue-fixed-light" />
          <span>{data.title}</span>
        </div>
      )}

      {data.cards.map((card, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-border bg-card dark:bg-slate-800/90 shadow-sm overflow-hidden"
        >
          {/* Card Header */}
          <div className="px-3.5 py-2.5 bg-muted/40 dark:bg-slate-900/60 border-b border-border flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground leading-snug">{card.title}</p>
              {card.subtitle && (
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                  {card.subtitle}
                </p>
              )}
            </div>
            {card.badge && (
              <span className="px-2 py-0.5 rounded-full border bg-blue-fixed/15 text-blue-fixed dark:text-blue-fixed-light border-blue-fixed/30 text-[10px] font-semibold whitespace-nowrap flex-shrink-0">
                {card.badge}
              </span>
            )}
          </div>

          {/* Metrics Grid */}
          <div className="p-3 grid grid-cols-2 gap-2.5 bg-card dark:bg-slate-800/50">
            {card.metrics.map((metric, mIdx) => (
              <div key={mIdx} className="min-w-0">
                <p className="text-[10px] text-muted-foreground truncate">{metric.label}</p>
                <p className="font-semibold text-foreground text-xs leading-snug break-words mt-0.5">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
