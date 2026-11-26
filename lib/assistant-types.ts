/**
 * LendGrid Assistant Frontend Type Definitions & Allowlist Rules
 */

export type AssistantMode = 'visitor' | 'authenticated';

export interface SseEvent {
  type: 'status' | 'text-delta' | 'ui-action' | 'suggestions' | 'done' | 'error' | 'session';
  sessionId?: string;
  visitorToken?: string;
  text?: string;
  action?: 'navigate' | 'applyFilter' | 'resetFilters' | 'renderTicketCard' | 'renderInfoCards';
  payload?: any;
  items?: string[];
  messageId?: string;
  message?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  statusText?: string;
  uiAction?: {
    action: string;
    payload: any;
  };
  suggestions?: string[];
  timestamp: string;
  feedback?: 'positive' | 'negative';
}

// Client-side mirror of allowlisted routes (Single source of truth)
export const CLIENT_ALLOWLISTED_ROUTES = [
  // Public
  '/',
  '/about-us',
  '/contact',
  '/login',
  '/signup',
  '/privacy-policy',
  '/terms-of-service',
  '/compliance',
  '/security',
  // Aggregator Admin
  '/aggregator',
  '/aggregator/applications',
  '/aggregator/applications/new',
  '/aggregator/commission',
  '/aggregator/team',
  '/aggregator/settings',
  '/aggregator/training',
  '/aggregator/deletion-requests',
  '/aggregator/products',
  '/aggregator/reports',
  // Aggregator Member
  '/aggregator-member',
  '/aggregator-member/applications',
  '/aggregator-member/products',
  // LendGrid Sales
  '/lendgrid-sales',
  '/lendgrid-sales/partners',
  '/lendgrid-sales/applications/new',
  // Lender Admin
  '/lender',
  '/lender/products',
  '/lender/insights',
  '/lender/applications',
  '/lender/payouts',
  '/lender/settings',
] as const;

export const CLIENT_ROLE_ROUTE_ALLOWLIST: Record<string, string[]> = {
  visitor: [
    '/',
    '/about-us',
    '/contact',
    '/login',
    '/signup',
    '/privacy-policy',
    '/terms-of-service',
    '/compliance',
    '/security',
  ],
  aggregator_admin: [
    '/',
    '/about-us',
    '/contact',
    '/aggregator',
    '/aggregator/applications',
    '/aggregator/applications/new',
    '/aggregator/commission',
    '/aggregator/team',
    '/aggregator/settings',
    '/aggregator/training',
    '/aggregator/deletion-requests',
    '/aggregator/products',
    '/aggregator/reports',
  ],
  aggregator_member: [
    '/',
    '/about-us',
    '/contact',
    '/aggregator-member',
    '/aggregator-member/applications',
    '/aggregator-member/products',
  ],
  lendgrid_sales: [
    '/',
    '/about-us',
    '/contact',
    '/lendgrid-sales',
    '/lendgrid-sales/partners',
    '/lendgrid-sales/applications/new',
  ],
  lender_admin: [
    '/',
    '/about-us',
    '/contact',
    '/lender',
    '/lender/products',
    '/lender/insights',
    '/lender/applications',
    '/lender/payouts',
    '/lender/settings',
  ],
  super_admin: [...CLIENT_ALLOWLISTED_ROUTES],
};

// Strict allowlisted search parameters for agentic filter synchronization (Zero PII allowed)
export const ALLOWED_FILTER_KEYS: Record<string, string[]> = {
  applications: ['status', 'search', 'from', 'to'],
  commission: ['status', 'page'],
};

