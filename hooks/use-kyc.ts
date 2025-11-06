import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { kycApi } from '@/lib/misc-apis'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/use-toast'

/**
 * Fetch KYC data
 */
export function useKyc(enabled = true) {
    return useQuery({
        queryKey: queryKeys.kyc.get(),
        queryFn: () => kycApi.get(),
        enabled,
    })
}

/**
 * Create KYC record
 */
export function useCreateKyc() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (payload: any) => kycApi.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.kyc.all })
            toast({
                title: 'Success',
                description: 'KYC record created successfully',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create KYC record',
                variant: 'destructive',
            })
        },
    })
}
