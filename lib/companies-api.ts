import { buildHeaders } from './http-client'

const ADMIN_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3010/api/v1'

export interface Company {
  id: number
  name: string
  email: string
  contactNumber: string
  companyId: number
  isActive: number
  createdAt: string
}

export interface CompaniesResponse {
  statusCode: number
  message: string
  data: {
    results: Company[]
    count: number
    pages: number
  }
}

export const companiesApi = {
  /**
   * Fetch all companies (aggregators) from f2fintech-admin-server
   * Used by Lendgrid Sales role dropdown in the header
   */
  getAll: async (params?: { page?: number; limit?: number }): Promise<CompaniesResponse> => {
    const query = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.limit ?? 100),
    })
    const res = await fetch(`${ADMIN_BASE_URL}/companies?${query}`, {
      method: 'GET',
      headers: buildHeaders({}, true), // skipCompanyId=true to avoid circular dependency
      credentials: 'include',
    })
    if (!res.ok) {
      throw new Error(`Failed to fetch companies: ${res.status}`)
    }
    return res.json()
  },
}
