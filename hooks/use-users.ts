import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/lib/users-api'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/use-toast'

interface UseUsersProps {
    page?: number
    limit?: number
    status?: string
    enabled?: boolean
}

/**
 * Fetch current user profile
 */
export function useProfile(enabled = true) {
    return useQuery({
        queryKey: queryKeys.users.profile(),
        queryFn: async () => {
            const response = await usersApi.profile()
            return response.profile
        },
        enabled,
    })
}

/**
 * Fetch users by role
 */
export function useUsersByRole(
    role: string,
    { page = 1, limit = 10, enabled = true }: UseUsersProps = {}
) {
    return useQuery({
        queryKey: queryKeys.users.byRole(role, page, limit),
        queryFn: async () => {
            const response = await usersApi.findByRole(role, { page, limit })
            return response.usersByRole
        },
        enabled: enabled && !!role,
    })
}

/**
 * Fetch all users
 */
export function useUsers({ page = 1, limit = 10, status, enabled = true }: UseUsersProps = {}) {
    return useQuery({
        queryKey: queryKeys.users.list(page, limit, status),
        queryFn: async () => {
            const response = await usersApi.getUsers({ page, limit, status })
            return response.users
        },
        enabled,
    })
}

/**
 * Login mutation
 */
export function useLogin() {
    const { toast } = useToast()

    return useMutation({
        mutationFn: (payload: { email: string; password: string }) => usersApi.login(payload),
        onSuccess: (data) => {
            if (data?.login?.success && data?.login?.access_token) {
                // Store token in cookie
                document.cookie = `token=${encodeURIComponent(
                    data.login.access_token
                )}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`
                toast({
                    title: 'Success',
                    description: 'Logged in successfully',
                })
            }
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to login',
                variant: 'destructive',
            })
        },
    })
}

/**
 * Register mutation
 */
export function useRegister() {
    const { toast } = useToast()

    return useMutation({
        mutationFn: (payload: any) => usersApi.register(payload),
        onSuccess: () => {
            toast({
                title: 'Success',
                description: 'User registered successfully',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to register',
                variant: 'destructive',
            })
        },
    })
}

/**
 * Update user mutation
 */
export function useUpdateUser() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (payload: { id: string; status?: string;[key: string]: any }) =>
            usersApi.updateUser(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
            toast({
                title: 'Success',
                description: 'User updated successfully',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update user',
                variant: 'destructive',
            })
        },
    })
}

/**
 * Delete user mutation
 */
export function useDeleteUser() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (id: string) => usersApi.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
            toast({
                title: 'Success',
                description: 'User deleted successfully',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete user',
                variant: 'destructive',
            })
        },
    })
}
