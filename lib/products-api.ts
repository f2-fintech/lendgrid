import { gqlFetch } from './http-client'
import type { CreateProductDto, ProductSummary } from './api-types'

export const productsApi = {
  /**
   * Get all products with pagination and filters
   */
  findAllProducts: (params?: { page?: number; limit?: number; lenderId?: string }) =>
    gqlFetch<{ findAllProducts: { results: ProductSummary[]; count: number; page: number; pages: number } }>({
      query: `
        query FindAllProducts($paginationArgs: ProductPaginationQuery!) {
          findAllProducts(paginationArgs: $paginationArgs) {
            results {
              _id
              name
              description
              productType
              interestRate
              commissionPercent
              processingFeePercent
              maxAmount
              minAmount
              tenure
              ageRange
              minIncome
              minCreditScore
              requiredDocuments
              isActive
              lender {
                user {
                  _id
                  username
                  email
                  status
                }
                profile {
                  _id
                  lenderName
                  lenderType
                }
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
        product?: ProductSummary
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
  updateProduct: (payload: { id: string } & Partial<CreateProductDto>) =>
    gqlFetch<{
      updateProduct: {
        success: boolean;
        message: string;
        product?: ProductSummary
      };
    }>({
      query: `
        mutation UpdateProduct($updateProductInput: UpdateProductDto!) {
          updateProduct(updateProductInput: $updateProductInput) {
            success
            message
            product {
              _id
              name
              productType
            }
          }
        }
      `,
      variables: { updateProductInput: payload },
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
  assignToAggregators: (productId: string, lenderProfileId: string, aggregatorIds: string[]) =>
    gqlFetch<{ assignProductToAggregators: { success: boolean; message: string } }>({
      query: `
        mutation AssignProduct($assignProductInput: AssignProductDto!) {
          assignProductToAggregators(assignProductInput: $assignProductInput) {
            success
            message
          }
        }
      `,
      variables: { assignProductInput: { productId, lenderProfileId, aggregatorIds } },
    }),

  /**
   * Unassign product from aggregators
   */
  unassignFromAggregators: (productId: string, lenderProfileId: string, aggregatorIds: string[]) =>
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
        unassignProductInput: { productId, lenderProfileId, aggregatorIds },
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
                tenure
                ageRange
                minIncome
                minCreditScore
                requiredDocuments
                isActive
              }
              lender {
                _id
                lenderName
                lenderType
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
