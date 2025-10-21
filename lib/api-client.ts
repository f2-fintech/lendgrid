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
					companyName
					gender
					address
					pincode
					lenderType
					profilePicture
					status
					role
					loginHistory
        		  }
        		  count
        		  page
        		  pages
        		}
      		}
    		`,
			variables: { role, ...params },
		}),
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
	findAllApplications: (params?: { page?: number; limit?: number; aggregatorId?: string; lenderId?: string }) =>
		gqlFetch<{ findAllApplications: { results: any[]; count: number; page: number; pages: number } }>({
			query: `
				query FindAllApplications($paginationArgs: ApplicationPaginationQuery!) {
					findAllApplications(paginationArgs: $paginationArgs) {
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
			variables: { paginationArgs: params },
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

export type ProductSummary = {
	_id: string
	name: string
	lenderName?: string
	interestRate: number
	maxAmount: number
	productType: string
	isActive: boolean
}

export type ProductPaginationResult = {
	results: ProductSummary[]
	count: number
	page: number
	pages: number
}

/**
 * CreateProductDto — matches backend CreateProductDto
 */
export type CreateProductDto = {
	lenderId?: string
	lenderName?: string
	name: string
	description?: string
	productType: string
	interestRate: number
	commissionPercent: number
	minAmount: number
	maxAmount: number
	loanTerm: number
	tenure?: string
	eligibilityCriteria?: string[]
	requiredDocuments?: string[]
	isActive?: boolean
}


export const productsApi = {
	findAllProducts: (params?: { page?: number; limit?: number; lenderId?: string }) =>
		gqlFetch<{ findAllProducts: { results: any[]; count: number; page: number; pages: number } }>({
			query: `
		        query FindAllProducts($paginationArgs: ProductPaginationQuery!) {
    		        findAllProducts(paginationArgs: $paginationArgs) {
        			  results {
				    	  _id
					      name
					      productType
					      interestRate
						  commissionPercent
					      maxAmount
					      minAmount
					      loanTerm
					      isActive
					      lender {
					        _id
					        username
					        email
						    }
					    }
					    count
					    page
					    pages
					  }
				}
			`,
			variables: { paginationArgs: params },
		}),
	createProduct: (payload: any) =>
		gqlFetch<{
			createProduct: {
				success: boolean
				message: string
				product?: {
					_id: string
					lenderName?: string
					name: string
					description?: string
					productType: string
				}
			}
		}>({
			query: `
				mutation CreateProduct($createProductInput: CreateProductDto!) {
					createProduct(createProductInput: $createProductInput) {
						    success
						    message
						    product {
						      _id,
						      name,
						      description,
						      productType
					    }
					}
				}
			`,
			variables: { createProductInput: payload },
		}),
	updateProduct: (id: string, payload: any) =>
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
	removeProduct: (id: string) =>
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

export const productAssignmentsApi = {
	assignToAggregators: (productId: string, aggregatorIds: string[]) =>
		gqlFetch<{ assignProductToAggregators: { success: boolean; message: string } }>({
			query: `
        mutation AssignProduct($assignProductInput: AssignProductDto!) {
          assignProductToAggregators(assignProductInput: $assignProductInput) {
            success
            message
          }
        }
      `,
			variables: {
				assignProductInput: { productId, aggregatorIds },
			},
		}),

	unassignFromAggregators: (productId: string, aggregatorIds: string[]) =>
		gqlFetch<{ unassignProductFromAggregators: { success: boolean; message: string } }>({
			query: `
        mutation UnassignProduct($unassignProductInput: UnassignProductDto!) {
          unassignProductFromAggregators(unassignProductInput: $unassignProductInput) {
            success
            message
          }
        }
      `,
			variables: {
				unassignProductInput: { productId, aggregatorIds },
			},
		}),

	getAssignedAggregators: (productId: string) =>
		gqlFetch<{ getAssignedAggregators: string[] }>({
			query: `
        query GetAssignedAggregators($productId: ID!) {
          getAssignedAggregators(productId: $productId)
        }
      `,
			variables: { productId },
		}),

	getMyAssignedProducts: (page: number = 1, limit: number = 10) =>
		gqlFetch<{
			getMyAssignedProducts: {
				results: any[];
				count: number;
				page: number;
				pages: number;
			};
		}>({
			query: `
        query GetMyAssignedProducts($page: Int!, $limit: Int!) {
          getMyAssignedProducts(page: $page, limit: $limit) {
            results {
              _id
              product {
                _id
                name
                productType
                interestRate
				commissionPercent
                minAmount
                maxAmount
                loanTerm
                isActive
              }
              lender {
                _id
                username
                email
                companyName
              }
              isActive
              createdAt
            }
            count
            page
            pages
          }
        }
      `,
			variables: { page, limit },
		}),
};
