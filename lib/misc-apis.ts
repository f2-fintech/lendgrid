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
