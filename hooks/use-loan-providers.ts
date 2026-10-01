import useSWR from 'swr'
import { apiFetch } from '@/lib/http-client'

export interface LoanProviderItem {
    id: number;
    title: string;
    max_tenure?: string;
    min_amount?: number;
    max_amount?: number;
    home_image?: string;
    country?: string;
    interest_rate?: string;
    description?: string;
    short_description?: string;
    long_description?: string;
    charges?: string;
    minimum_kyc?: string;
    document_required?: string;
    created_at?: string;
}

export interface LoanProvidersResponse {
    results: LoanProviderItem[];
    count: number;
    pages: number;
}

export function useLoanProviders(page: number = 1, limit: number = 100) {
    const key = `/get-all-loan-providers?page=${page}&limit=${limit}`

    const { data, error, isLoading, mutate } = useSWR<{
        statusCode: number;
        message: string;
        data: LoanProvidersResponse;
    }>(key, (url: string) => apiFetch<{
        statusCode: number;
        message: string;
        data: LoanProvidersResponse;
    }>(url), {
        revalidateOnFocus: false,
        dedupingInterval: 60000,
    })

    const providers = data?.data?.results || []
    const providerOptions = providers.map((p) => ({
        label: p.title,
        value: p.title,
    }))

    return {
        providers,
        providerOptions,
        isLoading,
        error,
        refetch: () => mutate(),
    }
}
