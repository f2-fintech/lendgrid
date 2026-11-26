'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Ticket as TicketIcon,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  MessageSquare,
  Building2,
  IndianRupee,
  Calendar,
  MapPin,
} from 'lucide-react';

export interface TicketCardData {
  ticket: {
    ticketId: number;
    customerName?: string;
    customerLocation?: string;
    customerState?: string;
    loanType?: string;
    loanCategory?: string;
    applicationAmount?: string | number;
    applicationTenure?: string | number;
    applicationDate?: string;
    provider?: string;
    employeeStatus?: string;
    loanStatus?: string;
    disbursed_amount?: string | number;
    disbursed_at?: string;
    approved_amount?: string | number;
    approved_at?: string;
    appliedByName?: string;
  };
  histories?: Array<{
    id?: number;
    action?: string;
    field_name?: string;
    old_value?: string;
    new_value?: string;
    change_description?: string;
    changed_by?: string;
    created_at?: string;
  }>;
  activities?: Array<{
    id?: number;
    activity_type?: string;
    comment?: string;
    user_name?: string;
    created_at?: string;
  }>;
  applicationsRoute?: string;
}

function getStatusBadgeClasses(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('disbursed')) {
    return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
  }
  if (s.includes('approved') || s === 'abnd') {
    return 'bg-blue-fixed/15 text-blue-fixed dark:text-blue-fixed-light border-blue-fixed/30';
  }
  if (s.includes('reject') || s.includes('drop')) {
    return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
  }
  if (s.includes('pendency') || s.includes('hold')) {
    return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
  }
  return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30';
}

function formatDateLabel(dateStr?: string): string {
  if (!dateStr || dateStr === 'No Date') return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTimeLabel(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TicketCard({ data }: { data: TicketCardData }) {
  const [showTimeline, setShowTimeline] = useState(false);

  if (!data?.ticket) return null;
  const { ticket, histories = [], activities = [], applicationsRoute = '/aggregator/applications' } = data;
  const statusText = ticket.employeeStatus || ticket.loanStatus || 'submitted';
  const totalTimelineCount = histories.length + activities.length;

  return (
    <div className="mt-2 w-full max-w-[340px] rounded-xl border border-border bg-card dark:bg-slate-800/90 shadow-sm overflow-hidden text-xs">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-muted/40 dark:bg-slate-900/60 border-b border-border flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 font-semibold text-blue-fixed dark:text-blue-fixed-light">
              <TicketIcon className="w-3.5 h-3.5" />
              #{ticket.ticketId}
            </span>
            {ticket.loanType && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize truncate">
                {ticket.loanType}
              </span>
            )}
          </div>
          <p className="font-semibold text-sm text-foreground truncate mt-0.5">
            {ticket.customerName || 'Customer'}
          </p>
          {ticket.customerLocation && ticket.customerLocation !== 'No Location available' && (
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5 truncate">
              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
              {ticket.customerLocation}
              {ticket.customerState && ticket.customerState !== 'No Location available'
                ? `, ${ticket.customerState}`
                : ''}
            </p>
          )}
        </div>

        <span
          className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold capitalize whitespace-nowrap flex-shrink-0 ${getStatusBadgeClasses(
            statusText,
          )}`}
        >
          {statusText}
        </span>
      </div>

      {/* Key Metrics Grid */}
      <div className="p-3 grid grid-cols-2 gap-2.5 bg-card dark:bg-slate-800/50">
        <div className="flex items-start gap-1.5">
          <IndianRupee className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">Loan Amount</p>
            <p className="font-semibold text-foreground truncate">
              {ticket.applicationAmount && ticket.applicationAmount !== 'No Amount'
                ? `₹${Number(ticket.applicationAmount).toLocaleString('en-IN')}`
                : 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">Lender</p>
            <p className="font-semibold text-foreground truncate">
              {ticket.provider && ticket.provider !== 'No Provider' ? ticket.provider : 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">Applied On</p>
            <p className="font-medium text-foreground truncate">
              {formatDateLabel(ticket.applicationDate)}
            </p>
          </div>
        </div>

        {ticket.disbursed_amount ? (
          <div className="flex items-start gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Disbursed</p>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                ₹{Number(ticket.disbursed_amount).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Tenure</p>
              <p className="font-medium text-foreground truncate">
                {ticket.applicationTenure && ticket.applicationTenure !== 'No Tenure'
                  ? `${ticket.applicationTenure} yrs`
                  : 'N/A'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Collapsible History & Activities */}
      {totalTimelineCount > 0 && (
        <div className="border-t border-border">
          <button
            type="button"
            onClick={() => setShowTimeline((prev) => !prev)}
            className="w-full px-3.5 py-2 flex items-center justify-between text-[11px] font-medium text-blue-fixed dark:text-blue-fixed-light hover:bg-muted/40 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Ticket History & Activities ({totalTimelineCount})
            </span>
            {showTimeline ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showTimeline && (
            <div className="px-3.5 pb-3 pt-1 max-h-56 overflow-y-auto space-y-2.5 bg-muted/20 dark:bg-slate-900/40 border-t border-border/60">
              {histories.map((h, idx) => (
                <div key={`h-${h.id ?? idx}`} className="relative pl-3 border-l-2 border-blue-fixed/40">
                  <p className="text-[11px] font-medium text-foreground leading-snug">
                    {h.action ||
                      h.change_description ||
                      (h.field_name
                        ? `${h.field_name}: ${h.old_value || '—'} → ${h.new_value || '—'}`
                        : 'Status updated')}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {h.changed_by ? `${h.changed_by} • ` : ''}
                    {formatDateTimeLabel(h.created_at)}
                  </p>
                </div>
              ))}

              {activities.map((a, idx) => (
                <div key={`a-${a.id ?? idx}`} className="relative pl-3 border-l-2 border-emerald-500/40">
                  <p className="text-[11px] text-foreground leading-snug flex items-start gap-1">
                    <MessageSquare className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{a.comment || a.activity_type || 'Activity logged'}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {a.user_name ? `${a.user_name} • ` : ''}
                    {formatDateTimeLabel(a.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer Action */}
      <div className="px-3.5 py-2 border-t border-border bg-muted/20 dark:bg-slate-900/40 flex justify-end">
        <Link
          href={applicationsRoute}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-fixed dark:text-blue-fixed-light hover:underline"
        >
          <span>View in Applications</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
