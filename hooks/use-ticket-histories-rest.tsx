import useSWR from 'swr'
import { apiFetch } from '@/lib/http-client'

export interface TicketHistoryData {
    id: number;
    ticket_id: number;
    action?: string | null;
    created_at: string;
}

export interface TicketHistoryResponse {
    statusCode: number;
    message: string;
    data: TicketHistoryData[];
}

/**
 * Hook for fetching ticket history with SWR (stale-while-revalidate) strategy.
 *
 * @param ticketId - The ticket ID to fetch history for
 * @param enabled - Whether to enable the query (default: true)
 * @returns An object containing the fetched history, loading state, error state, and refetch function
 */
export const useGetTicketHistory = (
    ticketId: number | null,
    enabled: boolean = true
) => {
    const shouldFetch = enabled && ticketId !== null

    const {
        data: swrData,
        error,
        isValidating,
        mutate
    } = useSWR<TicketHistoryResponse>(
        shouldFetch ? `/get-ticket-histories/${ticketId}` : null,
        (url) => apiFetch(url),
        {
            revalidateOnFocus: false,
            refreshInterval: 0,
        }
    )

    return {
        value: swrData?.data ?? [],
        swrLoading: !error && !swrData && isValidating && shouldFetch,
        error,
        refetch: () => mutate(),
    }
}
