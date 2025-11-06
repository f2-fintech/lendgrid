import { apiFetch } from './http-client'

export const kycApi = {
    /**
     * Create KYC record
     */
    create: (payload: any) => apiFetch('/api/v1/kyc', { method: 'POST', body: payload }),

    /**
     * Get KYC record
     */
    get: () => apiFetch('/api/v1/kyc'),
}

export const settingsApi = {
    /**
     * Create settings
     */
    create: (payload: any) => apiFetch('/api/v1/settings', { method: 'POST', body: payload }),

    /**
     * Get settings
     */
    get: () => apiFetch('/api/v1/settings'),

    /**
     * Update settings
     */
    update: (payload: any) => apiFetch('/api/v1/settings', { method: 'PATCH', body: payload }),
}

export const commissionsApi = {
    /**
     * List commissions with pagination
     */
    list: (params?: { page?: number; limit?: number; aggregatorId?: string }) =>
        apiFetch<{ success: boolean; data: { results: any[]; count: number; page: number; pages: number } }>(
            `/api/v1/commissions${params ? `?${new URLSearchParams(params as any).toString()}` : ''}`
        ),

    /**
     * Create commission
     */
    create: (payload: any) => apiFetch('/api/v1/commissions', { method: 'POST', body: payload }),

    /**
     * Update commission status
     */
    updateStatus: (id: string, payload: any) =>
        apiFetch(`/api/v1/commissions/${id}/status`, { method: 'PATCH', body: payload }),
}
