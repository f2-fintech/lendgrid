/**
 * Performance-Upload API helpers — talks to lendgrid-server REST endpoints
 * at /performance-upload/*
 */

const BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

function getHeaders(extra?: Record<string, string>): HeadersInit {
    if (typeof window === 'undefined') return {};
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extra };

    const value = `; ${document.cookie}`;
    const regularToken = (() => {
        const parts = value.split(`; token=`);
        if (parts.length === 2) return decodeURIComponent(parts.pop()!.split(';').shift() || '') || '';
        return '';
    })();
    const employeeToken = (() => {
        const parts = value.split(`; employee_token=`);
        if (parts.length === 2) return decodeURIComponent(parts.pop()!.split(';').shift() || '') || '';
        return '';
    })();

    const token = regularToken || employeeToken;
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // company_id from employee_token payload
    try {
        const payload = JSON.parse(atob((token.split('.')[1] || '').replace(/-/g, '+').replace(/_/g, '/')));
        if (payload?.company_id) headers['x-company-id'] = String(payload.company_id);
    } catch { /* ignore */ }

    return headers;
}

async function apiFetch(path: string, options: RequestInit = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: { ...getHeaders(), ...(options.headers as any) },
        credentials: 'include',
    });
    if (!res.ok) throw new Error(await res.text().catch(() => 'Request failed'));
    return res.json();
}

export const perfUploadApi = {
    /** Fetch performance rows for a date/company */
    list: (params: { date?: string; company_id?: string; search?: string } = {}) => {
        const qs = new URLSearchParams(
            Object.entries(params).filter(([, v]) => v).map(([k, v]) => [k, v!])
        ).toString();
        return apiFetch(`/performance-upload/get-performance${qs ? `?${qs}` : ''}`);
    },

    /** Get available uploaded dates */
    dates: (company_id?: string) =>
        apiFetch(`/performance-upload/dates${company_id ? `?company_id=${company_id}` : ''}`),

    /** Add rows manually */
    addRows: (rows: any[]) =>
        apiFetch('/performance-upload/rows', { method: 'POST', body: JSON.stringify(rows) }),

    /** Update a row */
    updateRow: (id: string, body: any) =>
        apiFetch(`/performance-upload/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

    /** Delete a row */
    deleteRow: (id: string) =>
        apiFetch(`/performance-upload/${id}`, { method: 'DELETE' }),

    /** Upload Excel file */
    uploadFile: (file: File, company_id?: string) => {
        const form = new FormData();
        form.append('file', file);
        const headers: Record<string, string> = {};
        if (typeof window !== 'undefined') {
            // pull token
            const value = `; ${document.cookie}`;
            const rParts = value.split(`; token=`);
            const eParts = value.split(`; employee_token=`);
            const token =
                (rParts.length === 2 ? decodeURIComponent(rParts.pop()!.split(';').shift() || '') : '') ||
                (eParts.length === 2 ? decodeURIComponent(eParts.pop()!.split(';').shift() || '') : '');
            if (token) headers['Authorization'] = `Bearer ${token}`;
            if (company_id) headers['x-company-id'] = company_id;
        }
        return fetch(`${BASE_URL}/performance-upload/file`, {
            method: 'POST', body: form, headers, credentials: 'include',
        }).then((r) => r.json());
    },

    /** Team totals (grouped by manager_tl field) */
    teamTotals: (company_id: string) =>
        apiFetch(`/performance-upload/team-totals?company_id=${company_id}`),

    /** Team breakdown by manager name */
    teamBreakdown: (name: string, company_id: string) =>
        apiFetch(`/performance-upload/team-breakdown/${encodeURIComponent(name)}?company_id=${company_id}`),
};
