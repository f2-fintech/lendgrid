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
		gqlFetch<{ login: { success: boolean; message: string; access_token?: string; } }>({
			query: `
        mutation Login($email: String!, $password: String!) {
          login(loginInput: { email: $email, password: $password }) {
            success
            message
            access_token
          }
        }
      `,
			variables: payload,
		}),
	register: (payload: any) =>
		gqlFetch({
			query: `
				mutation CreateUser($createUserInput: CreateUserDto!) {
					createUser(createUserInput: $createUserInput) {
						success
						message
						user {
							_id,
							username,
							email,
							role,
							companyName
						}
					}
				}
			`,
			variables: { createUserInput: payload },
		}),
	profile: () =>
		gqlFetch({
			query: `
				query Profile {
					profile {
						_id
						email
						role
					}
				}
			`,
		}),
	findByRole: (role: string, params?: { page?: number; limit?: number }) =>
		gqlFetch<{ usersByRole: { results: any[]; count: number; page: number; pages: number } }>({
			query: `
      query UsersByRole($role: Role!, $page: Int, $limit: Int) {
        usersByRole(role: $role, paginationArgs: { page: $page, limit: $limit }) {
          results {
            _id
			username
			email
			contact
			designation
			dob
			gender
			address
			pincode
			lenderType
			profilePicture
			status
			role
			loginHistory
			createdAt
			updatedAt
          }
          count
          page
          pages
        }
      }
    `,
			variables: { role, ...params },
		}),
	getAggregators: (params?: { page?: number; limit?: number }) =>
		usersApi.findByRole('AGGREGATOR_ADMIN', params),
	getUsers: (params?: { page?: number; limit?: number; status?: string }) =>
		gqlFetch<{ users: { results: any[]; count: number; pages: number } }>({
			query: `
				query Users($page: Int, $limit: Int, $status: String) {
					users(paginationArgs: { page: $page, limit: $limit, status: $status }) {
						results {
							_id
							email
							role
							status
						}
						count
						pages
					}
				}
			`,
			variables: params,
		}),
	updateUser: (payload: { id: string; status?: string;[key: string]: any }) =>
		gqlFetch({
			query: `
				mutation UpdateUser($updateUserInput: UpdateUserDto!) {
					updateUser(updateUserInput: $updateUserInput) {
						_id
						email
						role
						status
					}
				}
			`,
			variables: { updateUserInput: { ...payload, _id: payload._id } },
		}),
	remove: (id: string) =>
		gqlFetch({
			query: `
				mutation RemoveUser($id: ID!) {
					removeUser(id: $id) {
						_id
						status
					}
				}
			`,
			variables: { id },
		}),
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
		gqlFetch<{ applications: { results: any[]; count: number; page: number; pages: number } }>({
			query: `
				query Applications($query: ApplicationPaginationQuery!) {
					applications(query: $query) {
						results {
							_id
							customerName
							lenderName
							loanAmount
							status
							expectedCommission
						}
						count
						page
						pages
					}
				}
			`,
			variables: { query: params },
		}),
	create: (payload: any) =>
		gqlFetch({
			query: `
				mutation CreateApplication($createApplicationInput: CreateApplicationDto!) {
					createApplication(createApplicationInput: $createApplicationInput) {
						_id
					}
				}
			`,
			variables: { createApplicationInput: payload },
		}),
	updateStatus: (id: string, payload: any) =>
		gqlFetch({
			query: `
				mutation UpdateApplication($id: ID!, $updateApplicationInput: UpdateApplicationDto!) {
					updateApplication(id: $id, updateApplicationInput: $updateApplicationInput) {
						_id
						status
					}
				}
			`,
			variables: { id, updateApplicationInput: payload },
		}),
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
		gqlFetch<{ products: { results: any[]; count: number; page: number; pages: number } }>({
			query: `
				query Products($query: ProductPaginationQuery!) {
					products(query: $query) {
						results {
							_id
							name
							lenderName
							interestRate
							maxAmount
							isActive
						}
						count
						page
						pages
					}
				}
			`,
			variables: { query: params },
		}),
	create: (payload: any) =>
		gqlFetch({
			query: `
				mutation CreateProduct($createProductInput: CreateProductDto!) {
					createProduct(createProductInput: $createProductInput) {
						_id
					}
				}
			`,
			variables: { createProductInput: payload },
		}),
	update: (id: string, payload: any) =>
		gqlFetch({
			query: `
				mutation UpdateProduct($id: ID!, $updateProductInput: UpdateProductDto!) {
					updateProduct(id: $id, updateProductInput: $updateProductInput) {
						_id
					}
				}
			`,
			variables: { id, updateProductInput: payload },
		}),
	remove: (id: string) =>
		gqlFetch({
			query: `
				mutation RemoveProduct($id: ID!) {
					removeProduct(id: $id) {
						_id
					}
				}
			`,
			variables: { id },
		}),
}