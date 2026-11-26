/**
 * Client-Side Action Validator & Executor for LendGrid Assistant
 *
 * Enforces strict defense-in-depth:
 * Validates all agentic UI actions on the client against role allowlists
 * and rejects unapproved routes, malicious payloads, or potential PII.
 */

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import {
  CLIENT_ROLE_ROUTE_ALLOWLIST,
  ALLOWED_FILTER_KEYS,
} from './assistant-types';

export interface UiActionResult {
  executed: boolean;
  message?: string;
}

// Regex to detect potential PII in query params before placing in URL
const POTENTIAL_PII_REGEX = /(?:\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b|\b[2-9]{1}[0-9]{11}\b|\b(?:\d{4}[ -]?){3}\d{4}\b|\b\d{9,18}\b)/;

// Strict application/ticket ID pattern: APP000123, LG-2026-APP-001, or 24-hex Mongo ObjectId
export const APPLICATION_ID_SEARCH_REGEX =
  /^(?:F2FIN-\d{1,10}|TKT-\d{1,10}|APP-?\d{1,12}|LG-[A-Za-z0-9_-]{3,25}|[0-9a-fA-F]{24}|\d{1,8})$/i;

/**
 * Validates that a search term is strictly an Application/Ticket ID.
 * Rejects borrower names (e.g. Ramesh), phone numbers (+919876543210), PAN cards (ABCDE1234F), and Aadhaar.
 */
export function isValidApplicationIdSearch(val: string): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/i;
  const PHONE_REGEX = /^(?:\+?91)?[6-9]\d{9}$/;
  const AADHAAR_REGEX = /^\d{12}$/;
  if (PAN_REGEX.test(trimmed) || PHONE_REGEX.test(trimmed) || AADHAAR_REGEX.test(trimmed)) {
    return false;
  }
  return APPLICATION_ID_SEARCH_REGEX.test(trimmed);
}

// Dynamic cached route allowlists fetched from server to eliminate drift
let serverRoleAllowlist: Record<string, string[]> | null = null;

export async function syncAllowlistedRoutes(apiBaseUrl: string = 'http://localhost:4000'): Promise<void> {
  if (serverRoleAllowlist) return;
  try {
    const res = await fetch(`${apiBaseUrl}/api/v1/assistant/routes`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      if (data?.roleRouteAllowlist) {
        serverRoleAllowlist = data.roleRouteAllowlist;
      }
    }
  } catch (err: any) {
    console.debug('[Assistant Client] Using bundled route allowlist fallback:', err.message);
  }
}

export function validateAndExecuteAction(
  action: 'navigate' | 'applyFilter' | 'resetFilters' | string,
  payload: any,
  userRole: string = 'visitor',
  router: AppRouterInstance,
  currentPathname: string,
): UiActionResult {
  try {
    switch (action) {
      case 'navigate': {
        const targetRoute = payload?.route;
        if (!targetRoute || typeof targetRoute !== 'string') {
          return { executed: false, message: 'Invalid navigation route payload.' };
        }

        const normalizedRole = userRole?.toLowerCase() || 'visitor';
        const roleMap = serverRoleAllowlist || CLIENT_ROLE_ROUTE_ALLOWLIST;
        const allowedRoutes = roleMap[normalizedRole] || roleMap['visitor'] || [];

        if (!allowedRoutes.includes(targetRoute)) {
          console.warn(`[Assistant Client Security] Blocked unauthorized navigation attempt to: ${targetRoute} for role: ${normalizedRole}`);
          return {
            executed: false,
            message: `Navigation to ${targetRoute} is not permitted for your current role.`,
          };
        }

        router.push(targetRoute);
        return { executed: true };
      }

      case 'applyFilter': {
        const page = payload?.page;
        const filters = payload?.filters;

        if (!page || typeof page !== 'string' || !filters || typeof filters !== 'object') {
          return { executed: false, message: 'Invalid filter payload format.' };
        }

        const allowedKeys = ALLOWED_FILTER_KEYS[page];
        if (!allowedKeys) {
          console.warn(`[Assistant Client Security] Blocked filter application on unauthorized page: ${page}`);
          return { executed: false, message: `Filters cannot be applied to page ${page}.` };
        }

        const searchParams = new URLSearchParams(window.location.search);
        let filterApplied = false;

        for (const [key, value] of Object.entries(filters)) {
          if (!allowedKeys.includes(key)) {
            console.warn(`[Assistant Client Security] Rejected unallowlisted filter key: ${key}`);
            continue;
          }

          const strVal = String(value).trim();

          // Reject any value matching credit card, Aadhaar, PAN, or long account numbers
          if (POTENTIAL_PII_REGEX.test(strVal)) {
            console.warn(`[Assistant Client Security] Rejected suspected PII in filter value for key: ${key}`);
            continue;
          }

          // Strictly restrict search filter to Application/Ticket IDs only (No borrower names, phones, or PAN in URLs)
          if (key === 'search') {
            const isApplicationId = isValidApplicationIdSearch(strVal);
            if (!isApplicationId) {
              console.warn(
                `[Assistant Client Security] Rejected search parameter "${strVal}". Search filter in URL is strictly limited to Application/Ticket IDs (e.g. APP000123, LG-APP-001). Names, phone numbers, and PAN are rejected.`,
              );
              continue;
            }
          }

          searchParams.set(key, strVal);
          filterApplied = true;
        }

        if (filterApplied) {
          searchParams.set('assistant_filtered', 'true');
          const targetPath =
            page === 'applications'
              ? (currentPathname.includes('/applications') ? currentPathname : '/aggregator/applications')
              : (currentPathname.includes('/commission') ? currentPathname : '/aggregator/commission');

          router.push(`${targetPath}?${searchParams.toString()}`);
          return { executed: true };
        }

        return { executed: false, message: 'No valid allowlisted filters were provided.' };
      }

      case 'resetFilters': {
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.delete('assistant_filtered');
        searchParams.delete('status');
        searchParams.delete('search');
        searchParams.delete('from');
        searchParams.delete('to');
        searchParams.delete('page');

        const queryString = searchParams.toString();
        const cleanUrl = queryString ? `${currentPathname}?${queryString}` : currentPathname;
        router.push(cleanUrl);
        return { executed: true };
      }

      case 'renderTicketCard': {
        if (!payload?.ticket?.ticketId) {
          return { executed: false, message: 'Invalid ticket card payload.' };
        }
        return { executed: true };
      }

      case 'renderInfoCards': {
        if (!Array.isArray(payload?.cards) || payload.cards.length === 0) {
          return { executed: false, message: 'Invalid info cards payload.' };
        }
        return { executed: true };
      }

      default:
        console.warn(`[Assistant Client Security] Unknown assistant UI action: ${action}`);
        return { executed: false, message: `Unknown UI action: ${action}` };
    }
  } catch (err: any) {
    console.error('[Assistant Client Security] Error executing UI action:', err);
    return { executed: false, message: err.message };
  }
}

