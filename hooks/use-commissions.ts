import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { commissionsApi } from '@/lib/commission-api'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/use-toast'
import {
    CreateCommissionRuleInput,
    UpdateCommissionRuleInput,
    CalculateCommissionInput,
    UpdateCommissionStatusInput,
    CommissionRuleFilterInput,
    CommissionTransactionFilterInput
} from '@/lib/api-types'

// ========== Commission Rules Hooks ==========

interface UseCommissionRulesProps {
    page?: number
    limit?: number
    filters?: CommissionRuleFilterInput
    enabled?: boolean
}

/**
 * Fetch commission rules with pagination and filters
 */
export function useCommissionRules({
    page = 1,
    limit = 10,
    filters,
    enabled = true,
}: UseCommissionRulesProps = {}) {
    return useQuery({
        queryKey: queryKeys.commissions.rules.list({ page, limit, ...filters }),
        queryFn: () => commissionsApi.getRules({ page, limit, filters }),
        enabled,
    })
}

/**
 * Fetch single commission rule by ID
 */
export function useCommissionRule(id: string, enabled = true) {
    return useQuery({
        queryKey: queryKeys.commissions.rules.detail(id),
        queryFn: () => commissionsApi.getRule(id),
        enabled: enabled && !!id,
    })
}

/**
 * Create commission rule
 */
export function useCreateCommissionRule() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (input: CreateCommissionRuleInput) => commissionsApi.createRule(input),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.commissions.rules.all })
            toast({
                title: 'Success',
                description: data.message || 'Commission rule created successfully',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create commission rule',
                variant: 'destructive',
            })
        },
    })
}

/**
 * Update commission rule
 */
export function useUpdateCommissionRule() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateCommissionRuleInput }) =>
            commissionsApi.updateRule(id, input),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.commissions.rules.all })
            queryClient.invalidateQueries({ queryKey: queryKeys.commissions.rules.detail(variables.id) })
            toast({
                title: 'Success',
                description: data.message || 'Commission rule updated successfully',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update commission rule',
                variant: 'destructive',
            })
        },
    })
}

/**
 * Delete/Archive commission rule
 */
export function useDeleteCommissionRule() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (id: string) => commissionsApi.deleteRule(id),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.commissions.rules.all })
            toast({
                title: 'Success',
                description: data.message || 'Commission rule archived successfully',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to archive commission rule',
                variant: 'destructive',
            })
        },
    })
}

// ========== Commission Transactions Hooks ==========

interface UseCommissionTransactionsProps {
    page?: number
    limit?: number
    filters?: CommissionTransactionFilterInput
    enabled?: boolean
}

/**
 * Fetch commission transactions with pagination and filters
 */
export function useCommissionTransactions({
    page = 1,
    limit = 10,
    filters,
    enabled = true,
}: UseCommissionTransactionsProps = {}) {
    return useQuery({
        queryKey: queryKeys.commissions.transactions.list({ page, limit, ...filters }),
        queryFn: () => commissionsApi.getTransactions({ page, limit, filters }),
        enabled,
    })
}

/**
 * Calculate commission for an application
 */
export function useCalculateCommission() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (input: CalculateCommissionInput) => commissionsApi.calculateCommission(input),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.commissions.transactions.all })
            toast({
                title: 'Success',
                description: data.message || 'Commission calculated successfully',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to calculate commission',
                variant: 'destructive',
            })
        },
    })
}

/**
 * Update commission transaction status
 */
export function useUpdateCommissionStatus() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateCommissionStatusInput }) =>
            commissionsApi.updateTransactionStatus(id, input),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.commissions.transactions.all })
            toast({
                title: 'Success',
                description: data.message || 'Commission status updated successfully',
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
