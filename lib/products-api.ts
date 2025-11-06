import { gqlFetch } from './http-client'
import type { CreateProductDto } from './api-types'

export const productsApi = {
    /**
     * Get all products with pagination and filters
     */
    findAllProducts: (params?: { page?: number; limit?: number; lenderId?: string }) =>
        gqlFetch<{ findAllProducts: { results: any[]; count: number; page: number; pages: number } }>({
            query: `
        query FindAllProducts($paginationArgs: ProductPaginationQuery!) {
          findAllProducts(paginationArgs: $paginationArgs) {
            results {
              _id
              name
              productType
              interestRate
              commissionPercent
              maxAmount
              minAmount
              loanTerm
              isActive
              lender {
                _id
                username
                email
              }
            }
            count
            page
            pages
          }
        }
      `,
            variables: { paginationArgs: params },
        }),

    /**
     * Create new product
     */
    createProduct: (payload: CreateProductDto) =>
        gqlFetch<{
            createProduct: {
                success: boolean
                message: string
                product?: {
                    _id: string
                    lenderName?: string
                    name: string
                    description?: string
                    productType: string
                }
            }
        }>({
            query: `
        mutation CreateProduct($createProductInput: CreateProductDto!) {
          createProduct(createProductInput: $createProductInput) {
            success
            message
            product {
              _id
              name
              description
              productType
            }
          }
        }
      `,
            variables: { createProductInput: payload },
        }),

    /**
     * Update product
     */
    updateProduct: (id: string, payload: any) =>
        gqlFetch({
            query: `
        mutation UpdateProduct($id: ID!, $updateProductInput: UpdateProductDto!) {
          updateProduct(id: $id, updateProductInput: $updateProductInput) {
            _id
          }
        }
      `,
            variables: { id, updateProductInput: payload },
        }),

    /**
     * Delete product
     */
    removeProduct: (id: string) =>
        gqlFetch({
            query: `
        mutation RemoveProduct($id: ID!) {
          removeProduct(id: $id) {
            _id
          }
        }
      `,
            variables: { id },
        }),
}

export const productAssignmentsApi = {
    /**
     * Assign product to aggregators
     */
    assignToAggregators: (productId: string, aggregatorIds: string[]) =>
        gqlFetch<{ assignProductToAggregators: { success: boolean; message: string } }>({
            query: `
        mutation AssignProduct($assignProductInput: AssignProductDto!) {
          assignProductToAggregators(assignProductInput: $assignProductInput) {
            success
            message
          }
        }
      `,
            variables: {
                assignProductInput: { productId, aggregatorIds },
            },
        }),

    /**
     * Unassign product from aggregators
     */
    unassignFromAggregators: (productId: string, aggregatorIds: string[]) =>
        gqlFetch<{ unassignProductFromAggregators: { success: boolean; message: string } }>({
            query: `
        mutation UnassignProduct($unassignProductInput: UnassignProductDto!) {
          unassignProductFromAggregators(unassignProductInput: $unassignProductInput) {
            success
            message
          }
        }
      `,
            variables: {
                unassignProductInput: { productId, aggregatorIds },
            },
        }),

    /**
     * Get assigned aggregators for a product
     */
    getAssignedAggregators: (productId: string) =>
        gqlFetch<{ getAssignedAggregators: string[] }>({
            query: `
        query GetAssignedAggregators($productId: ID!) {
          getAssignedAggregators(productId: $productId)
        }
      `,
            variables: { productId },
        }),

    /**
     * Get products assigned to current user (aggregator)
     */
    getMyAssignedProducts: (page: number = 1, limit: number = 10) =>
        gqlFetch<{
            getMyAssignedProducts: {
                results: any[]
                count: number
                page: number
                pages: number
            }
        }>({
            query: `
        query GetMyAssignedProducts($page: Int!, $limit: Int!) {
          getMyAssignedProducts(page: $page, limit: $limit) {
            results {
              _id
              product {
                _id
                name
                productType
                interestRate
                commissionPercent
                minAmount
                maxAmount
                loanTerm
                tenure
                isActive
              }
              lender {
                _id
                username
                email
                companyName
              }
              isActive
              createdAt
            }
            count
            page
            pages
          }
        }
      `,
            variables: { page, limit },
        }),
}
