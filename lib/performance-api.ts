/**
 * Performance API helpers — talks to lendgrid-server REST endpoints
 * at /performance/*  (same as HRMS-server)
 *
 * Auth: reads employee_token cookie (same mechanism as useEmployeeAuth hook)
 * and decodes company_id from the JWT payload.
 */

const BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

function getEmployeeTokenFromCookie(): string {
    if (typeof document === 'undefined') return '';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; employee_token=`);
    if (parts.length === 2) {
        return decodeURIComponent(parts.pop()!.split(';').shift() || '') || '';
    }
    return '';
}

function decodeJwtPayload(token: string): any {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch {
        return {};
    }
}

function getHeaders(): HeadersInit {
    if (typeof window === 'undefined') return {};
    const token = getEmployeeTokenFromCookie();
    const payload = token ? decodeJwtPayload(token) : {};
    const companyId = payload?.company_id || '';

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (companyId) headers['x-company-id'] = companyId;
    return headers;
}

async function apiFetch(path: string, options: RequestInit = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: { ...getHeaders(), ...(options.headers as any) },
    });
    if (!res.ok) {
        const err = await res.text().catch(() => 'Request failed');
        throw new Error(err);
    }
    return res.json();
}

export const perfApi = {
    list: (params: Record<string, any> = {}) => {
        const qs = new URLSearchParams(
            Object.entries(params)
                .filter(([, v]) => v !== undefined && v !== '')
                .map(([k, v]) => [k, String(v)]),
        ).toString();
        return apiFetch(`/performance/list${qs ? `?${qs}` : ''}`);
    },

    missingList: (params: { date: string; keyword?: string }) => {
        const qs = new URLSearchParams(
            Object.entries(params)
                .filter(([, v]) => v !== undefined && v !== '')
                .map(([k, v]) => [k, String(v)]),
        ).toString();
        return apiFetch(`/performance/missing/list?${qs}`);
    },

    saveREMorning: (body: any) =>
        apiFetch('/performance/re/morning', {
            method: 'POST',
            body: JSON.stringify(body),
        }),

    saveREEvening: (body: any) =>
        apiFetch('/performance/re/evening', {
            method: 'POST',
            body: JSON.stringify(body),
        }),

    upsertManager: (body: any) =>
        apiFetch('/performance/manager', {
            method: 'POST',
            body: JSON.stringify(body),
        }),

    updateManagerById: (id: string, body: any) =>
        apiFetch(`/performance/manager/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
        }),
};
