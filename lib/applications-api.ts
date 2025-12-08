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
    gqlFetch<{ findAllApplications: { success: boolean; message: string; results: any[]; count: number; page: number; pages: number } }>({
      query: `
        query FindAllApplications($paginationArgs: ApplicationPaginationQuery!) {
          findAllApplications(paginationArgs: $paginationArgs) {
            success
            message
            results {
              _id
              applicationNumber
              customerName
              customerEmail
              customerPhone
              customerPan
              customerAddress
              customerCity
              customerState
              customerPincode
              loanAmount
              tenure
              status
              documents
              approvedAmount
              approvedDate
              disbursedAmount
              disbursedDate
              rejectionReason
              createdAt
              updatedAt
              workHistory {
                action
                comment
                timestamp
                updatedBy
              }
              aggregator {
                _id
                companyName
              }
              lender {
                _id
                lenderName
                lenderType
              }
              product {
                _id
                name
                productType
                interestRate
                commissionPercent
                processingFeePercent
                minAmount
                maxAmount
                tenure
                requiredDocuments
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
              applicationNumber
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
                lenderType
                lenderName
              }
              aggregator {
                _id
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
            applicationNumber
            customerName
            loanAmount
            status
            updatedAt
            updatedBy
            workHistory {
              action
              comment
              timestamp
              updatedBy
            }
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
            applicationNumber
            customerName
          }
        }
      `,
      variables: { id },
    }),
}
