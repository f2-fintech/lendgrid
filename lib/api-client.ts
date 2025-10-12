/* Simple REST and GraphQL client for LendGrid */

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'

function getAuthToken(): string | null {
	if (typeof document === 'undefined') return null
	const value = `; ${document.cookie}`
	const parts = value.split(`; token=`)
	if (parts.length === 2) return decodeURIComponent(parts.pop()!.split(';').shift() || '') || null
	return null
}

function buildHeaders(extra?: HeadersInit): HeadersInit {
	const headers: HeadersInit = {
		'Content-Type': 'application/json',
		...extra,
	}
	const token = getAuthToken()
	if (token) {
		(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
	}
	return headers
}

export async function apiFetch<T>(path: string, options: { method?: HttpMethod; body?: any; headers?: HeadersInit; baseUrl?: string } = {}): Promise<T> {
	const { method = 'GET', body, headers, baseUrl = DEFAULT_BASE_URL } = options
	const url = `${baseUrl}${path}`
	const resp = await fetch(url, {
		method,
		headers: buildHeaders(headers),
		body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
		credentials: 'include',
	})
	if (!resp.ok) {
		const text = await resp.text().catch(() => '')
		throw new Error(text || `Request failed with status ${resp.status}`)
	}
	return resp.json() as Promise<T>
}

type GraphQLRequest = {
	query: string
	variables?: Record<string, any>
}

export async function gqlFetch<T>({ query, variables }: GraphQLRequest, baseUrl: string = DEFAULT_BASE_URL): Promise<T> {
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

export const usersApi = {
	login: (payload: { email: string; password: string }) =>
		apiFetch<{ success: boolean; data: { access_token: string; user: any } }>(
			'/api/v1/users/login',
			{ method: 'POST', body: payload }
		),
	register: (payload: any) =>
		apiFetch('/api/v1/users/register', { method: 'POST', body: payload }),
	profile: () =>
		apiFetch('/api/v1/users/profile'),
	findByRole: (role: string, params?: { page?: number; limit?: number }) =>
		apiFetch<{ success: boolean; data: { results: any[]; count: number; page: number; pages: number } }>(
			`/api/v1/users/role/${role}${params ? `?${new URLSearchParams(Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)]))).toString()}` : ''}`
		),
	countByRole: (role: string) =>
		apiFetch<{ success: boolean; data: { count: number } }>(`/api/v1/users/role/${role}/count`),
	// Get all aggregators (users with AGGREGATOR_ADMIN role)
	getAggregators: (params?: { page?: number; limit?: number }) =>
		apiFetch<{ success: boolean; data: { results: any[]; count: number; page: number; pages: number } }>(
			`/api/v1/users/role/aggregator_admin${params ? `?${new URLSearchParams(Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)]))).toString()}` : ''}`
		),
	// Get all users with pagination
	getUsers: (params?: { page?: number; limit?: number; status?: string }) =>
		apiFetch<{ success: boolean; data: { results: any[]; count: number; pages: number } }>(
			`/api/v1/users${params ? `?${new URLSearchParams(Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)]))).toString()}` : ''}`
		),
	// Fixed method name from 'update' to 'updateUser' to match component usage
	updateUser: (payload: { id: string; status?: string;[key: string]: any }) =>
		apiFetch(`/api/v1/users`, { method: 'PATCH', body: payload }),
	update: (id: string, payload: any) =>
		apiFetch(`/api/v1/users`, { method: 'PATCH', body: { id, ...payload } }),
	updateUserByAdmin: (payload: { id: string; status?: string; email?: string; username?: string;[key: string]: any }) =>
		apiFetch(`/api/v1/users`, { method: 'PATCH', body: payload }),
	remove: (id: string) =>
		apiFetch(`/api/v1/users/${id}`, { method: 'DELETE' }),
}

export const kycApi = {
	create: (payload: any) =>
		apiFetch('/api/v1/kyc', { method: 'POST', body: payload }),
	get: () =>
		apiFetch('/api/v1/kyc'),
}

export const settingsApi = {
	create: (payload: any) =>
		apiFetch('/api/v1/settings', { method: 'POST', body: payload }),
	get: () =>
		apiFetch('/api/v1/settings'),
	update: (payload: any) =>
		apiFetch('/api/v1/settings', { method: 'PATCH', body: payload }),
}

export const applicationsApi = {
	list: (params?: { page?: number; limit?: number; aggregatorId?: string; lenderId?: string }) =>
		apiFetch<{ success: boolean; data: { results: any[]; count: number; page: number; pages: number } }>(
			`/api/v1/applications${params ? `?${new URLSearchParams(params as any).toString()}` : ''}`
		),
	create: (payload: any) => apiFetch('/api/v1/applications', { method: 'POST', body: payload }),
	updateStatus: (id: string, payload: any) => apiFetch(`/api/v1/applications/${id}/status`, { method: 'PATCH', body: payload }),
}

export const commissionsApi = {
	list: (params?: { page?: number; limit?: number; aggregatorId?: string }) =>
		apiFetch<{ success: boolean; data: { results: any[]; count: number; page: number; pages: number } }>(
			`/api/v1/commissions${params ? `?${new URLSearchParams(params as any).toString()}` : ''}`
		),
	create: (payload: any) => apiFetch('/api/v1/commissions', { method: 'POST', body: payload }),
	updateStatus: (id: string, payload: any) => apiFetch(`/api/v1/commissions/${id}/status`, { method: 'PATCH', body: payload }),
}

export const productsApi = {
	list: (params?: { page?: number; limit?: number; lenderId?: string }) =>
		apiFetch<{ success: boolean; data: { results: any[]; count: number; page: number; pages: number } }>(
			`/api/v1/products${params ? `?${new URLSearchParams(params as any).toString()}` : ''}`
		),
	create: (payload: any) => apiFetch('/api/v1/products', { method: 'POST', body: payload }),
	update: (id: string, payload: any) => apiFetch(`/api/v1/products/${id}`, { method: 'PATCH', body: payload }),
	remove: (id: string) => apiFetch(`/api/v1/products/${id}`, { method: 'DELETE' }),
}