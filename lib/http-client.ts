import { decodeJwt } from "./utils";

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'
const DEFAULT_BASE_URL_REST = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3010/api/v1'

export function getCompanyId(): string | null {
    if (typeof window === 'undefined') return null;

    // Sales dropdown selection takes highest priority
    const selectedCompanyId = localStorage.getItem('selectedCompanyId');
    if (selectedCompanyId) return selectedCompanyId;

    const token =
        document.cookie
            .split('; ')
            .find(row => row.startsWith('lendgrid_cookie='))
            ?.split('=')[1] || null;

    const decoded = decodeJwt(token);
    if (decoded?.companyId) {
        return String(decoded.companyId);
    }

    // Fallback to localStorage
    return localStorage.getItem('companyId');
}

/**
 * Get authentication token from cookie
 */
export function getAuthToken(): string | null {
    if (typeof document === 'undefined') return null
    // Try regular token first
    const value = `; ${document.cookie}`
    const parts = value.split(`; lendgrid_cookie=`)
    if (parts.length === 2) {
        const t = decodeURIComponent(parts.pop()!.split(';').shift() || '') || null
        if (t) return t
    }
    // Fall back to employee_token for employee-only sessions
    const empParts = value.split(`; employee_token=`)
    if (empParts.length === 2) {
        return decodeURIComponent(empParts.pop()!.split(';').shift() || '') || null
    }
    return null
}

/**
 * Build headers with auth token
 */
export function buildHeaders(extra?: HeadersInit, skipCompanyId: boolean = false): HeadersInit {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...extra,
    }
    const token = getAuthToken()
    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }

    if (!skipCompanyId) {
        const companyId = getCompanyId();
        if (companyId) {
            (headers as Record<string, string>)['companyid'] = companyId;
        }
    }

    return headers
}

/**
 * Generic REST API fetch wrapper
 */
export async function apiFetch<T>(
    path: string,
    options: {
        method?: HttpMethod
        body?: any
        headers?: HeadersInit
        baseUrl?: string
        skipCompanyId?: boolean
    } = {}
): Promise<T> {
    const { method = 'GET', body, headers, baseUrl = DEFAULT_BASE_URL_REST, skipCompanyId = false } = options
    const url = `${baseUrl}${path}`

    const resp = await fetch(url, {
        method,
        headers: buildHeaders(headers, skipCompanyId),
        body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
        credentials: 'include',
    })

    if (!resp.ok) {
        const text = await resp.text().catch(() => '')
        throw new Error(text || `Request failed with status ${resp.status}`)
    }

    return resp.json() as Promise<T>
}

/**
 * GraphQL request type
 */
type GraphQLRequest = {
    query: string
    variables?: Record<string, any>
}

/**
 * Generic GraphQL fetch wrapper
 */
export async function gqlFetch<T>(
    { query, variables }: GraphQLRequest,
    baseUrl: string = DEFAULT_BASE_URL
): Promise<T> {
    const resp = await fetch(`${baseUrl}/graphql`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ query, variables }),
        credentials: 'include',
    })

    const data = await resp.json()

    if (data.errors?.length) {
        throw new Error(data.errors[0]?.message || 'GraphQL error')
    }

    return data.data as T
}
