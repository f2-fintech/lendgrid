/* Simple REST and GraphQL client for LendGrid */

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'

function getAuthToken(): string | null {
	if (typeof window === 'undefined') return null
	return localStorage.getItem('token')
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
		body: body ? JSON.stringify(body) : undefined,
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
	register: (payload: any) => apiFetch('/api/v1/users/register', { method: 'POST', body: payload }),
	profile: () => apiFetch('/api/v1/users/profile'),
}


