import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi, productAssignmentsApi } from '@/lib/products-api'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/use-toast'
import type { CreateProductDto } from '@/lib/api-types'

interface UseProductsProps {
    page?: number
    limit?: number
    lenderId?: string
    enabled?: boolean
}

/**
 * Fetch all products
 */
export function useProducts({
    page = 1,
    limit = 10,
    lenderId,
    enabled = true,
}: UseProductsProps = {}) {
    return useQuery({
        queryKey: queryKeys.products.list(page, limit, lenderId),
        queryFn: async () => {
            const response = await productsApi.findAllProducts({ page, limit, lenderId })
            return response.findAllProducts
        },
        enabled,
    })
}

/**
 * Fetch my assigned products (for aggregators)
 */
export function useMyAssignedProducts({
    page = 1,
    limit = 10,
    enabled = true,
}: Omit<UseProductsProps, 'lenderId'> = {}) {
    return useQuery({
        queryKey: queryKeys.products.myAssigned(page, limit),
        queryFn: async () => {
            const response = await productAssignmentsApi.getMyAssignedProducts(page, limit)
            return response.getMyAssignedProducts
        },
        enabled,
    })
}

/**
 * Fetch assigned aggregators for a product
 */
export function useAssignedAggregators(productId: string, enabled = true) {
    return useQuery({
        queryKey: queryKeys.products.assignedAggregators(productId),
        queryFn: async () => {
            const response = await productAssignmentsApi.getAssignedAggregators(productId)
            return response.getAssignedAggregators
        },
        enabled: enabled && !!productId,
    })
}

/**
 * Create product
 */
export function useCreateProduct() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (payload: CreateProductDto) => productsApi.createProduct(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
            toast({
                title: 'Success',
                description: 'Product created successfully',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create product',
                variant: 'destructive',
            })
        },
    })
}

/**
 * Update product
 */
export function useUpdateProduct() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: any }) =>
            productsApi.updateProduct(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
            toast({
                title: 'Success',
                description: 'Product updated successfully',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update product',
                variant: 'destructive',
            })
        },
    })
}

/**
 * Delete product
 */
export function useDeleteProduct() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (id: string) => productsApi.removeProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
            toast({
                title: 'Success',
                description: 'Product deleted successfully',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete product',
                variant: 'destructive',
            })
        },
    })
}

/**
 * Assign product to aggregators
 */
export function useAssignProduct() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ productId, aggregatorIds }: { productId: string; aggregatorIds: string[] }) =>
            productAssignmentsApi.assignToAggregators(productId, aggregatorIds),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.products.assignedAggregators(variables.productId),
            })
            toast({
                title: 'Success',
                description: 'Product assigned successfully',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to assign product',
                variant: 'destructive',
            })
        },
    })
}

/**
 * Unassign product from aggregators
 */
export function useUnassignProduct() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ productId, aggregatorIds }: { productId: string; aggregatorIds: string[] }) =>
            productAssignmentsApi.unassignFromAggregators(productId, aggregatorIds),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.products.assignedAggregators(variables.productId),
            })
            toast({
                title: 'Success',
                description: 'Product unassigned successfully',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to unassign product',
                variant: 'destructive',
            })
        },
    })
}
