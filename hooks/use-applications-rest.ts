import useSWR from 'swr'
import { apiFetch } from '@/lib/http-client'

type UseApplicationsProps = {
    page?: number
    limit?: number
    aggregatorId?: string
    status?: string
    search?: string
    enabled?: boolean
}

export interface CustomerApplication {
    applicationAmount: string;
    applicationDate: string;
    applicationId: number;
    applicationNumber: number;
    applicationProvider: string;
    applicationTenure: number;
    companyId: number;

    customerContact: string;
    customerDesignation: string;
    customerEmail: string;
    customerId: number;
    customerLocation: string;
    customerName: string;
    customerPAN: string;
    customerProfileImage: string[];
    customerState: string;

    loanCategory: 'secured' | 'unsecured';
    loanType: string;
    loanStatus: string;
}

type ApplicationsResponse = {
    results: CustomerApplication[];
    count: number
    pages: number
}

export function useApplicationsRest({
    page = 1,
    limit = 10,
    aggregatorId,
    status,
    search,
    enabled = true,
}: UseApplicationsProps) {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    })

    // if (aggregatorId) params.append('appliedBy', aggregatorId)
    if (status) params.append('status', status)
    if (search) params.append('search', search)

    const key = enabled ? `/get-customer-loan-applications?${params}` : null

    const { data, error, isLoading, mutate } = useSWR<{
        statusCode: number
        message: string
        data: ApplicationsResponse
    }>(key, (url) => apiFetch(url))

    return {
        data: data?.data,
        isLoading,
        error,
        refetch: () => mutate(),
    }
}
