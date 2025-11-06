import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsApi } from '@/lib/applications-api'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/use-toast'

interface UseApplicationsProps {
    page?: number
    limit?: number
    aggregatorId?: string
    lenderId?: string
    productId?: string
    status?: string
    enabled?: boolean
}

/**
 * Fetch applications with filters
 */
export function useApplications(props: UseApplicationsProps = {}) {
    const { page = 1, limit = 10, enabled = true, ...filters } = props

    return useQuery({
        queryKey: queryKeys.applications.list({ page, limit, ...filters }),
        queryFn: async () => {
            const response = await applicationsApi.findAllApplications({
                page,
                limit,
                ...filters,
            })
            return response.findAllApplications
        },
        enabled,
    })
}

/**
 * Create application mutation
 */
export function useCreateApplication() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (payload: any) => applicationsApi.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.applications.all })
            toast({
                title: 'Success',
                description: 'Application created successfully',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create application',
                variant: 'destructive',
            })
        },
    })
}

// Update application mutation
export function useUpdateApplication() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: any }) =>
            applicationsApi.update(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.applications.all })
            toast({
                title: 'Success',
                description: 'Application updated successfully',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update application',
                variant: 'destructive',
            })
        },
    })
}

// Delete application mutation
export function useDeleteApplication() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (id: string) => applicationsApi.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.applications.all })
            toast({
                title: 'Success',
                description: 'Application deleted successfully',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete application',
                variant: 'destructive',
            })
        },
    })
}
