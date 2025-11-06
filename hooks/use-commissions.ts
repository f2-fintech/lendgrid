import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { commissionsApi } from '@/lib/misc-apis'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/use-toast'

interface UseCommissionsProps {
    page?: number
    limit?: number
    aggregatorId?: string
    enabled?: boolean
}

/**
 * Fetch commissions
 */
export function useCommissions({
    page = 1,
    limit = 10,
    aggregatorId,
    enabled = true,
}: UseCommissionsProps = {}) {
    return useQuery({
        queryKey: queryKeys.commissions.list(page, limit, aggregatorId),
        queryFn: async () => {
            const response = await commissionsApi.list({ page, limit, aggregatorId })
            return response.data
        },
        enabled,
    })
}

/**
 * Create commission
 */
export function useCreateCommission() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (payload: any) => commissionsApi.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.commissions.all })
            toast({
                title: 'Success',
                description: 'Commission created successfully',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create commission',
                variant: 'destructive',
            })
        },
    })
}

/**
 * Update commission status
 */
export function useUpdateCommissionStatus() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: any }) =>
            commissionsApi.updateStatus(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.commissions.all })
            toast({
                title: 'Success',
                description: 'Commission status updated successfully',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update commission status',
                variant: 'destructive',
            })
        },
    })
}
