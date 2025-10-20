import { useState, useEffect, useCallback } from 'react'
import { productsApi } from '@/lib/api-client'

export interface Product {
    _id: string
    name: string
    lenderName?: string
    description?: string
    productType: string
    interestRate: number
    commissionPercent?: number
    minAmount?: number
    maxAmount: number
    loanTerm: number
    tenure?: string
    eligibilityCriteria?: string[]
    requiredDocuments?: string[]
    isActive: boolean
    createdAt?: string
    updatedAt?: string
}

export interface ProductsResponse {
    products: Product[]
    total: number
    pages: number
}

interface UseProductsProps {
    page?: number
    limit?: number
    lenderId?: string
}

/**
 * Hook to fetch, manage and refresh products list
 */
export function useProducts({ page, limit, lenderId }: UseProductsProps = {}) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<ProductsResponse>({
        products: [],
        total: 0,
        pages: 0,
    })

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await productsApi.findAllProducts({
                page: page || 1,
                limit: limit || 10,
                lenderId,
            })

            if (response?.findAllProducts && response.findAllProducts.results.length !== 0) {
                const { results, count, pages } = response.findAllProducts
                setData({
                    products: results || [],
                    total: count || 0,
                    pages: pages || Math.ceil((count || 0) / (limit || 10)),
                })
            }
        } catch (err) {
            console.error('Failed to fetch products:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch products')
        } finally {
            setLoading(false)
        }
    }, [page, limit, lenderId])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    return { ...data, loading, error, mutate: fetchData }
}

/**
 * Create a new product
 */
export async function createProduct(payload: any) {
    return productsApi.createProduct(payload)
}

/**
 * Update an existing product
 */
export async function updateProduct(id: string, payload: any) {
    return productsApi.updateProduct(id, payload)
}

/**
 * Remove a product
 */
export async function removeProduct(id: string) {
    return productsApi.removeProduct(id)
}
