import useSWR from 'swr'
import { apiFetch } from '@/lib/http-client'

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
        (url) => apiFetch(url)
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
