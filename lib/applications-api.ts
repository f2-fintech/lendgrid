import { gqlFetch } from './http-client'

export const applicationsApi = {
    /**
     * Get all applications with pagination and filters
     */
    findAllApplications: (params?: {
        page?: number
        limit?: number
        aggregatorId?: string
        lenderId?: string
        productId?: string
        status?: string
    }) =>
        gqlFetch<{ findAllApplications: { results: any[]; count: number; page: number; pages: number } }>({
            query: `
        query FindAllApplications($paginationArgs: ApplicationPaginationQuery!) {
          findAllApplications(paginationArgs: $paginationArgs) {
            success
            message
            results {
              _id
              customerName
              customerEmail
              customerPhone
              loanAmount
              status
              documents
              disbursedAmount
              disbursedDate
              commissionRate
              expectedCommission
              rejectionReason
              createdAt
              updatedAt
              aggregator {
                _id
                username
                email
                companyName
              }
              lender {
                _id
                username
                email
                companyName
              }
              product {
                _id
                name
                productType
                interestRate
                commissionPercent
                minAmount
                maxAmount
                loanTerm
              }
            }
            count
            page
            pages
          }
        }
      `,
            variables: { paginationArgs: params || {} },
        }),

    /**
     * Create new application
     */
    create: (payload: any) =>
        gqlFetch({
            query: `
        mutation CreateApplication($createApplicationInput: CreateApplicationDto!) {
          createApplication(createApplicationInput: $createApplicationInput) {
            success
            message
            application {
              _id
              customerName
              loanAmount
              createdAt
              product {
                _id
                name
                productType
              }
              lender {
                _id
                username
                companyName
              }
              aggregator {
                _id
                username
                companyName
              }
            }
          }
        }
      `,
            variables: { createApplicationInput: payload },
        }),

    /**
     * Update application
     */
    update: (id: string, payload: any) =>
        gqlFetch({
            query: `
        mutation UpdateApplication($updateApplicationInput: UpdateApplicationDto!) {
          updateApplication(updateApplicationInput: $updateApplicationInput) {
            _id
            customerName
            loanAmount
            status
            updatedAt
          }
        }
      `,
            variables: { updateApplicationInput: { id, ...payload } },
        }),

    /**
     * Delete application
     */
    remove: (id: string) =>
        gqlFetch({
            query: `
        mutation RemoveApplication($id: ID!) {
          removeApplication(id: $id) {
            _id
            customerName
          }
        }
      `,
            variables: { id },
        }),
}
