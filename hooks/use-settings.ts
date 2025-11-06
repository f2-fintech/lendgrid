import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from '@/lib/misc-apis'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/use-toast'

/**
 * Fetch settings
 */
export function useSettings(enabled = true) {
    return useQuery({
        queryKey: queryKeys.settings.get(),
        queryFn: () => settingsApi.get(),
        enabled,
    })
}

/**
 * Create settings
 */
export function useCreateSettings() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (payload: any) => settingsApi.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.settings.all })
            toast({
                title: 'Success',
                description: 'Settings created successfully',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create settings',
                variant: 'destructive',
            })
        },
    })
}

/**
 * Update settings
 */
export function useUpdateSettings() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (payload: any) => settingsApi.update(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.settings.all })
            toast({
                title: 'Success',
                description: 'Settings updated successfully',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update settings',
                variant: 'destructive',
            })
        },
    })
}
