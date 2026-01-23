import useSWR from 'swr'
import { apiFetch, getCompanyId } from '@/lib/http-client'

export interface JoinedTicketData {
    customer_application_id: number;
    user_id: number;
    forwarded_to: number;
    forwarded_by: number;
    is_forwarded: number;
    original_estimate: string;
    voice_note_url: string | null;
    due_date: Date;
    created_at: Date;
    ticketId: number;
    ticketStatus: string;
    applicationAmount: string;
    applicationTenure: number;
    applicationDate: string;
    applicationId: number;
    customerId: number;
    customerName: string;
    customerEmail: string;
    customerContact: string;
    customerProfileImage: string;
    customerLocation: string;
    customerState: string;
    loanStatus: string;
    loanCategory: string;
}

export interface Ticket {
    results: JoinedTicketData[];
    count: number;
    pages: number;
    errorMessage?: string;
}

/**
 * Hook for fetching tickets with SWR (stale-while-revalidate) strategy.
 *
 * @param pathKey - The API path key used by SWR to fetch ticket data.
 * @param page - Current page number for pagination.
 * @param limit - Size of each page for pagination.
 * @returns An object containing the fetched tickets, loading state, and error state.
 */
export const useGetTickets = (
    pathKey: string,
    page: number = 1,
    limit: number = 6,
    filter: string = "",
    startDate: string | null = null,
    endDate: string | null = null
) => {
    const params = new URLSearchParams();
    if (filter) params.set("name", filter);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    const fullPath = pathKey.includes('?')
        ? `${pathKey}&page=${page}&limit=${limit}&${params.toString()}`
        : `${pathKey}?page=${page}&limit=${limit}&${params.toString()}`;

    const {
        data: swrData,
        error,
        isValidating,
        mutate
    } = useSWR<{
        statusCode: number;
        message: string;
        data: {
            results: JoinedTicketData[];
            count: number;
            pages: number;
            totalDisbursedAmount?: number;
        };
    }>(
        fullPath,
        (url) => apiFetch(url),
        {
            revalidateOnFocus: false,
            refreshInterval: 0,
        }
    );

    return {
        value: {
            results: swrData?.data?.results ?? [],
            count: swrData?.data?.count ?? 0,
            pages: swrData?.data?.pages ?? 0,
            totalDisbursedAmount: swrData?.data?.totalDisbursedAmount ?? 0
        },
        swrLoading: !error && !swrData && isValidating,
        error,
        refetch: () => mutate(),
    };
};

/**
 * Hook to fetch ticket count for a specific company/aggregator
 */
type TicketStatsResponse =
    | number
    | {
        count: number
        amount: number
    }

export function useDashboardTicketStats(
    params: {
        status?: string
        userId?: number
        date?: string
        month?: string
        year?: string
        companyId?: number
    },
    userRole?: 'super_admin' | 'aggregator_admin'
) {
    const shouldFetch =
        userRole === 'aggregator_admin' ||
        (userRole === 'super_admin' && params.companyId)

    const query = new URLSearchParams()

    if (params.status) query.append('status', params.status)
    if (params.userId) query.append('userId', String(params.userId))
    if (params.date) query.append('date', params.date)
    if (params.month) query.append('month', params.month)
    if (params.year) query.append('year', params.year)

    const key = shouldFetch ? `/dashboard/tickets/count?${query}` : null

    const { data, error, isLoading } = useSWR(
        key,
        () => {
            if (userRole === 'super_admin' && params.companyId) {
                return apiFetch(`/dashboard/tickets/count?${query}`, {
                    headers: { Companyid: String(params.companyId) },
                })
            }
            // Aggregator → Companyid auto from buildHeaders()
            return apiFetch(`/dashboard/tickets/count?${query}`)
        },
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    )

    const result = data?.data

    return {
        count:
            typeof result === 'number'
                ? result
                : result?.count ?? 0,

        amount:
            typeof result === 'object'
                ? result.amount ?? 0
                : 0,

        isLoading,
        error,
    }
}

export function useDisbursedTicketsByMonth(
    year: number,
    companyId?: number,
    userRole?: 'super_admin' | 'aggregator_admin'
) {
    const resolvedCompanyId =
        userRole === 'super_admin'
            ? companyId
            : Number(getCompanyId()) || undefined

    const shouldFetch =
        userRole === 'aggregator_admin' ||
        (userRole === 'super_admin' && resolvedCompanyId)

    const key = shouldFetch
        ? `/dashboard/disbursed-by-month-${year}-${resolvedCompanyId ?? 'self'}`
        : null

    const { data, error, isLoading } = useSWR(
        key,
        () => {
            const query = new URLSearchParams({ year: String(year) })

            if (resolvedCompanyId) {
                query.append('companyId', String(resolvedCompanyId))
            }

            return apiFetch(
                `/dashboard/tickets/done-counts-by-month?${query.toString()}`
            )
        },
        { revalidateOnFocus: false }
    )

    return {
        data: data?.data ?? [],
        isLoading,
        error,
    }
}

