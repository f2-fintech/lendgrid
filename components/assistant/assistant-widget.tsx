'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Bot,
  Loader2,
  StopCircle,
  Search,
  HelpCircle,
  Briefcase,
  Volume2,
  VolumeX,
  ShieldCheck,
  ArrowUpRight,
  CornerDownRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MarkdownMessage } from './markdown-message';
import { TicketCard } from './ticket-card';
import { InfoCards } from './info-cards';
import { useAssistantChat } from '@/hooks/use-assistant-chat';
import { SuggestionChip } from '@/lib/assistant-types';
import { decodeJwt, deleteCookie } from '@/lib/utils';
import { usersApi } from '@/lib/users-api';

const HIDDEN_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/turnstile-mobile',
];

/** Branded LendGrid Co-pilot Avatar */
function AssistantAvatar({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-13 h-13',
  }[size];

  return (
    <div
      className={`relative rounded-full overflow-hidden flex items-center justify-center bg-[#0a4d9c] text-white shadow-inner flex-shrink-0 ${sizeClasses} ${className}`}
    >
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[72%] h-[72%]"
        aria-hidden="true"
      >
        <circle cx="18" cy="18" r="16" fill="url(#lg-bot-gradient)" />
        <path
          d="M12 21.5C12 18.1863 14.6863 15.5 18 15.5C21.3137 15.5 24 18.1863 24 21.5V22.5C24 23.0523 23.5523 23.5 23 23.5H13C12.4477 23.5 12 23.0523 12 22.5V21.5Z"
          fill="white"
          fillOpacity="0.95"
        />
        <circle cx="18" cy="12" r="4.2" fill="white" />
        <path
          d="M10 16.5C10 12.0817 13.5817 8.5 18 8.5C22.4183 8.5 26 12.0817 26 16.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect x="8" y="14.5" width="3" height="4.5" rx="1.5" fill="white" />
        <rect x="25" y="14.5" width="3" height="4.5" rx="1.5" fill="white" />
        <defs>
          <linearGradient id="lg-bot-gradient" x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1E40AF" />
            <stop offset="0.6" stopColor="#2563EB" />
            <stop offset="1" stopColor="#4F46E5" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export function AssistantWidget() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  // Passively detect authenticated user from lendgrid_cookie without redirecting visitors
  useEffect(() => {
    let active = true;

    async function loadOptionalUser() {
      const cookieStr = typeof document !== 'undefined' ? document.cookie : '';
      const tokenMatch = cookieStr.split('; ').find((c) => c.startsWith('lendgrid_cookie='));
      const token = tokenMatch ? decodeURIComponent(tokenMatch.split('=')[1]) : null;

      if (!token) {
        if (active) setUser(null);
        return;
      }

      try {
        const decoded: any = decodeJwt(token);
        if (!decoded) {
          if (active) setUser(null);
          return;
        }

        const isOms = decoded?.source === 'oms';
        const rawRole = decoded?.role?.toLowerCase();
        if (isOms || rawRole === 'sales' || rawRole === 'sub_admin' || rawRole === 'lendgrid_sales') {
          if (active) {
            setUser({
              username: decoded?.username || decoded?.name || decoded?.first_name || 'OMS Staff',
              email: decoded?.email || '',
              role: decoded?.role,
              omsRole: rawRole,
              isSales: rawRole === 'sales',
              omsUserId: decoded?.id || decoded?.sub,
              source: 'oms',
            });
          }
          return;
        }

        const profileResp: any = await usersApi.profile();
        if (active) {
          setUser(profileResp?.profile || null);
        }
      } catch {
        deleteCookie('lendgrid_cookie');
        if (active) setUser(null);
      }
    }

    loadOptionalUser();
    return () => {
      active = false;
    };
  }, [pathname]);
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ASSISTANT_ENABLED === 'false') {
      return false;
    }
    return true;
  });

  // Query backend ASSISTANT_ENABLED kill-switch
  useEffect(() => {
    let active = true;
    const apiUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:4000';
    fetch(`${apiUrl}/api/v1/assistant/config`, { credentials: 'omit' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data && typeof data.assistantEnabled === 'boolean') {
          setIsEnabled(data.assistantEnabled);
        }
      })
      .catch(() => { });
    return () => {
      active = false;
    };
  }, []);

  const {
    isOpen,
    setIsOpen,
    messages,
    statusText,
    isStreaming,
    suggestions,
    sendMessage,
    executeSuggestion,
    abortStream,
    clearSession,
    submitFeedback,
  } = useAssistantChat(user);

  const [input, setInput] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showTeaser, setShowTeaser] = useState(true);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Play subtle native audio chime on message if not muted
  const playChime = useCallback(() => {
    if (isMuted || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // AudioContext blocked by policy or unavailable
    }
  }, [isMuted]);

  // Auto-scroll to bottom on new tokens/messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, statusText, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Keyboard accessibility: Escape to close + Focus Trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        return;
      }

      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  // Hide widget on authentication and mobile-turnstile pages where it is inappropriate
  const isHiddenPage = HIDDEN_ROUTES.some(
    (route) => pathname === route || pathname?.startsWith(`${route}/`),
  );

  useEffect(() => {
    if (isHiddenPage && isOpen) {
      setIsOpen(false);
    }
  }, [isHiddenPage, isOpen, setIsOpen]);

  if (!isEnabled || isHiddenPage) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    playChime();
    sendMessage(input);
    setInput('');
  };

  const handleSuggestionClick = (chipOrText: string | SuggestionChip) => {
    playChime();
    setIsOpen(true);
    setShowTeaser(false);
    if (typeof chipOrText === 'string') {
      sendMessage(chipOrText);
      return;
    }
    executeSuggestion(chipOrText);
  };

  const handleChipRailKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const buttons = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not([disabled])'),
    );
    const currentIdx = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (currentIdx === -1) return;
    e.preventDefault();
    const nextIdx =
      e.key === 'ArrowRight'
        ? (currentIdx + 1) % buttons.length
        : (currentIdx - 1 + buttons.length) % buttons.length;
    buttons[nextIdx]?.focus();
    buttons[nextIdx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  };

  // Dynamic context greetings & options
  const defaultGreeting = user ? (
    'Hi! How can I assist with your lending portfolio today?'
  ) : (
    <>
      Hi! Are you looking for a{' '}
      <a
        href="https://f2fintech.com/application-form"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-blue-fixed dark:text-blue-fixed-light underline underline-offset-2 hover:opacity-80"
      >
        loan
      </a>{' '}
      or partnership?
    </>
  );

  const defaultStarterOptions = user
    ? [
      { label: 'Check pending commissions & payouts', icon: Sparkles, query: 'What is my pending commission?' },
      { label: 'Review application status & metrics', icon: Search, query: 'Show my dashboard metrics' },
      { label: 'Ask a question about LendGrid platform', icon: HelpCircle, query: 'How does LendGrid aggregator platform work?' },
    ]
    : [
      { label: 'Find a lender or explore loan products', icon: Search, query: 'Which lenders and loan products are available?' },
      { label: 'Become a LendGrid DSA partner', icon: Briefcase, query: 'How do I become a DSA partner?' },
      { label: 'Ask a question about commissions & earnings', icon: HelpCircle, query: 'What commission rates are offered?' },
    ];

  // Current formatted time for chat header timestamp
  const formattedCurrentTime = `Today ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase()}`;

  return (
    <>
      {/* ─── Floating Action Launcher & Teaser Popup ───────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3 pointer-events-none">
        <AnimatePresence>
          {!isOpen && showTeaser && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex flex-col items-end gap-2 mb-1"
            >
              {/* Teaser Speech Bubble */}
              <div className="relative bg-card dark:bg-slate-900 border border-border shadow-xl rounded-2xl p-3.5 max-w-[280px] md:max-w-[320px]">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs md:text-sm font-medium text-foreground leading-snug">
                    {defaultGreeting}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTeaser(false);
                    }}
                    className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors -mr-1 -mt-1"
                    aria-label="Dismiss greeting"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Quick Action Pill Buttons */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  onClick={() => handleSuggestionClick(defaultStarterOptions[0].query)}
                  className="rounded-full border border-blue-fixed dark:border-blue-fixed-light bg-white dark:bg-slate-900 text-blue-fixed dark:text-blue-fixed-light px-3.5 py-1.5 text-xs font-medium hover:bg-blue-fixed/10 dark:hover:bg-blue-fixed/20 shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Search className="w-3.5 h-3.5 text-blue-fixed dark:text-blue-fixed-light" />
                  <span>{user ? 'Check commissions' : 'Find a loan'}</span>
                </button>
                <button
                  onClick={() => handleSuggestionClick(defaultStarterOptions[2].query)}
                  className="rounded-full border border-blue-fixed dark:border-blue-fixed-light bg-white dark:bg-slate-900 text-blue-fixed dark:text-blue-fixed-light px-3.5 py-1.5 text-xs font-medium hover:bg-blue-fixed/10 dark:hover:bg-blue-fixed/20 shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-blue-fixed dark:text-blue-fixed-light" />
                  <span>Ask a question</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Circular Avatar Launcher Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setIsOpen((prev) => !prev);
            setShowTeaser(false);
          }}
          className="pointer-events-auto relative flex items-center justify-center w-14 h-14 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-fixed/30 ring-4 ring-blue-fixed/10 shadow-xl hover:shadow-2xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-fixed focus:ring-offset-2 p-0.5"
          aria-label={isOpen ? 'Close LendGrid Assistant' : 'Open LendGrid Assistant'}
        >
          {isOpen ? (
            <div className="w-12 h-12 rounded-full bg-[#0a4d9c] dark:bg-[#1d4ed8] flex items-center justify-center text-white shadow-inner">
              <X className="w-6 h-6 text-white" />
            </div>
          ) : (
            <>
              <AssistantAvatar size="md" className="w-full h-full" />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm" />
            </>
          )}
        </motion.button>
      </div>

      {/* ─── Expanded Assistant Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-label="LendGrid Assistant Co-pilot"
            className="fixed bottom-24 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] md:w-[410px] h-[590px] max-h-[calc(100vh-7.5rem)] flex flex-col rounded-2xl bg-card dark:bg-slate-900 border border-border shadow-2xl overflow-hidden"
          >
            {/* Header: Solid Deep Blue Banner */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#0a4d9c] dark:bg-[#1e40af] text-white shadow-sm flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full border-2 border-white/50 ring-2 ring-white/20 overflow-hidden flex items-center justify-center bg-white/10 shadow-sm">
                    <AssistantAvatar size="md" className="w-full h-full" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border border-white rounded-full" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm md:text-base text-white tracking-tight leading-tight">
                    LendGrid Assistant
                  </h3>
                  <p className="text-[11px] text-white/80 truncate max-w-[190px] md:max-w-[220px]">
                    {user?.role
                      ? `Co-pilot: ${user.role.replace('_', ' ')}`
                      : 'A co-pilot to navigate your lending operations'}
                  </p>
                </div>
              </div>

              {/* Header Controls */}
              <div className="flex items-center gap-0.5">
                {/* Audio toggle button */}
                <button
                  type="button"
                  onClick={() => setIsMuted((prev) => !prev)}
                  className="w-8 h-8 rounded-full text-white/80 hover:text-white hover:bg-white/15 flex items-center justify-center transition-colors"
                  title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                {/* Clear session button */}
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="w-8 h-8 rounded-full text-white/80 hover:text-white hover:bg-white/15 flex items-center justify-center transition-colors"
                    title="Clear conversation"
                    aria-label="Clear conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* Close window button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full text-white/80 hover:text-white hover:bg-white/15 flex items-center justify-center transition-colors"
                  title="Close assistant"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Clear Confirmation Banner */}
            {showClearConfirm && (
              <div className="px-4 py-2 bg-destructive/15 border-b border-destructive/20 flex items-center justify-between text-xs flex-shrink-0 animate-fadeIn">
                <span className="text-destructive font-medium">Clear entire chat history?</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      clearSession();
                      setShowClearConfirm(false);
                    }}
                    className="px-2.5 py-0.5 rounded bg-destructive text-destructive-foreground font-semibold text-xs"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2.5 py-0.5 rounded bg-muted text-muted-foreground text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Compact Dismissible Privacy Notice */}
            {showPrivacyNotice && (
              <div className="px-2.5 py-1.5 mx-3 mt-2 rounded-lg bg-muted/40 dark:bg-muted/20 border border-border/50 flex items-center justify-between gap-2 text-[10px] text-muted-foreground flex-shrink-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-fixed dark:text-blue-fixed-light flex-shrink-0" />
                  <span className="truncate">
                    Data protected under our{' '}
                    <Link
                      href="/compliance"
                      className="font-medium text-blue-fixed dark:text-blue-fixed-light underline underline-offset-2 hover:opacity-80"
                    >
                      privacy policy
                    </Link>
                    .
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrivacyNotice(false)}
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors flex-shrink-0"
                  aria-label="Dismiss privacy notice"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto px-3.5 py-2 space-y-3">
              {/* Centered Date/Time Stamp */}
              <div className="text-center my-1.5">
                <span className="text-[10px] text-muted-foreground font-medium bg-muted/50 dark:bg-muted/30 px-2.5 py-0.5 rounded-full">
                  {formattedCurrentTime}
                </span>
              </div>

              {/* Initial Greeting & Starter Option Cards (When chat is empty) */}
              {messages.length === 0 && (
                <div className="space-y-2.5 animate-fadeIn">
                  {/* Greeting Bubble */}
                  <div className="flex flex-col items-start">
                    <div className="max-w-[88%] rounded-2xl rounded-tl-sm px-4 py-2.5 bg-slate-100 dark:bg-slate-800/90 text-foreground border border-slate-200/70 dark:border-slate-700/60 shadow-sm text-sm">
                      <p className="whitespace-pre-wrap">{defaultGreeting}</p>
                    </div>
                  </div>

                  {/* Grouped Starter Options Card */}
                  <div className="rounded-xl border border-border bg-card dark:bg-slate-800/60 shadow-sm divide-y divide-border overflow-hidden max-w-[88%]">
                    {defaultStarterOptions.map((opt, idx) => {
                      const IconComponent = opt.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(opt.query)}
                          className="w-full px-3.5 py-2.5 flex items-center gap-3 text-xs font-medium text-blue-fixed dark:text-blue-fixed-light hover:bg-blue-fixed/10 dark:hover:bg-blue-fixed/20 transition-colors text-left"
                        >
                          <IconComponent className="w-4 h-4 text-blue-fixed dark:text-blue-fixed-light flex-shrink-0" />
                          <span className="flex-1">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Message History */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user'
                      ? 'bg-blue-fixed text-white rounded-tr-sm shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/60 text-foreground rounded-tl-sm shadow-sm'
                      }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    ) : (
                      <MarkdownMessage content={msg.content || '...'} />
                    )}
                  </div>

                  {/* UI Action / Rich Cards */}
                  {msg.uiAction?.action === 'renderTicketCard' ? (
                    <TicketCard data={msg.uiAction.payload} />
                  ) : msg.uiAction?.action === 'renderInfoCards' ? (
                    <InfoCards data={msg.uiAction.payload} />
                  ) : msg.uiAction ? (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-blue-fixed dark:text-blue-fixed-light px-1">
                      <Sparkles className="w-3 h-3 flex-shrink-0" />
                      <span>Action executed: {msg.uiAction.action}</span>
                    </div>
                  ) : null}

                  {/* Timestamp & Helpful Feedback */}
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>

                    {msg.role === 'assistant' && msg.content && (
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          onClick={() => submitFeedback(msg.id, 'positive')}
                          className={`p-1 rounded hover:bg-muted text-xs transition-colors ${msg.feedback === 'positive'
                            ? 'text-emerald-500 font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                          title="Helpful"
                          aria-label="Helpful"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => submitFeedback(msg.id, 'negative')}
                          className={`p-1 rounded hover:bg-muted text-xs transition-colors ${msg.feedback === 'negative'
                            ? 'text-rose-500 font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                          title="Not helpful"
                          aria-label="Not helpful"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Status Indicator ("Thinking...", "Fetching Information") */}
              {statusText && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg w-fit animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-fixed dark:text-blue-fixed-light" />
                  <span>{statusText}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Topic Chips & Contextual Next-Step Pills */}
            {isStreaming ? (
              <div
                className="px-3.5 py-2 border-t border-border/50 bg-muted/30 flex-shrink-0"
                role="status"
                aria-live="polite"
                aria-label="Updating suggested replies"
              >
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1.5 font-medium">
                  <Sparkles className="w-3 h-3 text-blue-fixed dark:text-blue-fixed-light animate-pulse" />
                  <span>Updating suggested replies...</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-hidden pb-1">
                  <span className="h-6 w-28 rounded-full bg-muted animate-pulse flex-shrink-0" />
                  <span className="h-6 w-24 rounded-full bg-muted animate-pulse flex-shrink-0" />
                  <span className="h-6 w-20 rounded-full bg-muted animate-pulse flex-shrink-0" />
                </div>
              </div>
            ) : (
              suggestions.length > 0 && (
                <div
                  className="px-3.5 py-2 border-t border-border/50 bg-muted/30 flex-shrink-0"
                  role="region"
                  aria-label="Suggested topics and contextual quick replies"
                >
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1.5 font-medium">
                    <Sparkles className="w-3 h-3 text-blue-fixed dark:text-blue-fixed-light" />
                    <span>
                      {suggestions.some((c) => c.contextual)
                        ? 'Quick replies & topics:'
                        : 'Suggested topics:'}
                    </span>
                  </div>
                  <div
                    onKeyDown={handleChipRailKeyDown}
                    className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar scroll-smooth"
                  >
                    {suggestions.map((chip) => {
                      const isContextual = Boolean(chip.contextual);
                      const isNavigate = chip.action === 'navigate';
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => handleSuggestionClick(chip)}
                          disabled={isStreaming}
                          aria-label={
                            isNavigate
                              ? `${chip.label} (navigates to page)`
                              : `${chip.label} (send reply)`
                          }
                          className={
                            isContextual
                              ? 'whitespace-nowrap inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-fixed hover:bg-blue-fixed/90 border border-blue-fixed text-xs font-medium text-white shadow-sm transition-all flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-fixed focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed'
                              : 'whitespace-nowrap inline-flex items-center gap-1 px-3 py-1 rounded-full bg-card dark:bg-slate-800 border border-blue-fixed/30 dark:border-blue-fixed-light/40 hover:bg-blue-fixed/10 dark:hover:bg-blue-fixed/20 text-xs font-medium text-blue-fixed dark:text-blue-fixed-light shadow-sm transition-all flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-fixed focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed'
                          }
                        >
                          {isContextual &&
                            (isNavigate ? (
                              <ArrowUpRight className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                            ) : (
                              <CornerDownRight className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                            ))}
                          <span>{chip.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            )}

            {/* Bottom Input Bar */}
            <form
              onSubmit={handleSubmit}
              className="p-2.5 border-t border-border bg-background/95 dark:bg-slate-900/95 flex-shrink-0"
            >
              <div className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 dark:bg-slate-800/40 px-2 py-1 focus-within:ring-2 focus-within:ring-blue-fixed/40 focus-within:border-blue-fixed transition-all">
                {/* Input Field */}
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isStreaming
                      ? 'Assistant is answering...'
                      : 'Choose an option or ask anything...'
                  }
                  disabled={isStreaming}
                  className="flex-1 border-0 shadow-none bg-transparent text-xs md:text-sm px-1.5 py-1 focus-visible:ring-0 focus-visible:outline-none placeholder:text-muted-foreground/60 h-8"
                />

                {/* Send / Stop Action Button */}
                {isStreaming ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={abortStream}
                    className="w-8 h-8 text-destructive hover:bg-destructive/10 rounded-lg flex-shrink-0"
                    title="Stop generating"
                  >
                    <StopCircle className="w-4 h-4" />
                  </Button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-fixed dark:text-blue-fixed-light hover:bg-blue-fixed/10 dark:hover:bg-blue-fixed/20 disabled:text-muted-foreground/30 disabled:hover:bg-transparent transition-colors flex-shrink-0"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
