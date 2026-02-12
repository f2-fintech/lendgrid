import { gqlFetch } from './http-client'
import {
  PaginatedCommissionRules,
  PaginatedCommissionTransactions,
  CommissionRuleResponse,
  CommissionTransactionResponse,
  CreateCommissionRuleInput,
  UpdateCommissionRuleInput,
  CalculateCommissionInput,
  UpdateCommissionStatusInput,
  CommissionRuleFilterInput,
  CommissionTransactionFilterInput,
} from './api-types'

export const commissionsApi = {
  // ========== Commission Rules ==========

  /**
   * Get paginated list of commission rules
   */
  getRules: (params?: {
    page?: number
    limit?: number
    filters?: CommissionRuleFilterInput
  }) =>
    gqlFetch<{ getCommissionRules: PaginatedCommissionRules }>({
      query: `
        query GetCommissionRules($page: Int, $limit: Int, $filters: CommissionRuleFilterInput) {
          getCommissionRules(page: $page, limit: $limit, filters: $filters) {
            success
            message
            data {
              id
              ruleName
              productType
              commissionType
              commissionRate
              minAmount
              maxAmount
              applicableFor
              aggregatorType
              status
              priority
              description
              effectiveFrom
              effectiveTo
              createdAt
              updatedAt
              createdBy
              updatedBy
            }
            total
            page
            limit
            pages
          }
        }
      `,
      variables: {
        page: params?.page,
        limit: params?.limit,
        filters: params?.filters,
      },
    }).then(res => res.getCommissionRules),

  /**
   * Get single commission rule by ID
   */
  getRule: (id: string) =>
    gqlFetch<{ getCommissionRule: CommissionRuleResponse }>({
      query: `
        query GetCommissionRule($id: ID!) {
          getCommissionRule(id: $id) {
            success
            message
            data {
              id
              ruleName
              productType
              commissionType
              commissionRate
              minAmount
              maxAmount
              applicableFor
              aggregatorType
              status
              priority
              description
              effectiveFrom
              effectiveTo
              createdAt
              updatedAt
              createdBy
              updatedBy
            }
          }
        }
      `,
      variables: { id },
    }).then(res => res.getCommissionRule),

  /**
   * Create new commission rule
   */
  createRule: (input: CreateCommissionRuleInput) =>
    gqlFetch<{ createCommissionRule: CommissionRuleResponse }>({
      query: `
        mutation CreateCommissionRule($input: CreateCommissionRuleInput!) {
          createCommissionRule(input: $input) {
            success
            message
            data {
              id
              ruleName
              productType
              commissionType
              commissionRate
              minAmount
              maxAmount
              applicableFor
              aggregatorType
              status
              priority
              description
              createdAt
              updatedAt
            }
          }
        }
      `,
      variables: { input },
    }).then(res => res.createCommissionRule),

  /**
   * Update commission rule
   */
  updateRule: (id: string, input: UpdateCommissionRuleInput) =>
    gqlFetch<{ updateCommissionRule: CommissionRuleResponse }>({
      query: `
        mutation UpdateCommissionRule($id: ID!, $input: UpdateCommissionRuleInput!) {
          updateCommissionRule(id: $id, input: $input) {
            success
            message
            data {
              id
              ruleName
              productType
              commissionType
              commissionRate
              minAmount
              maxAmount
              applicableFor
              aggregatorType
              status
              priority
              description
              updatedAt
            }
          }
        }
      `,
      variables: { id, input },
    }).then(res => res.updateCommissionRule),

  /**
   * Archive commission rule
   */
  deleteRule: (id: string) =>
    gqlFetch<{ deleteCommissionRule: CommissionRuleResponse }>({
      query: `
        mutation DeleteCommissionRule($id: ID!) {
          deleteCommissionRule(id: $id) {
            success
            message
            data {
              id
              status
            }
          }
        }
      `,
      variables: { id },
    }).then(res => res.deleteCommissionRule),

  // ========== Commission Transactions ==========

  /**
   * Get paginated list of commission transactions
   */
  getTransactions: (params?: {
    page?: number
    limit?: number
    filters?: CommissionTransactionFilterInput
  }) =>
    gqlFetch<{ getCommissionTransactions: PaginatedCommissionTransactions }>({
      query: `
      query GetCommissionTransactions($page: Int, $limit: Int, $filters: CommissionTransactionFilterInput) {
        getCommissionTransactions(page: $page, limit: $limit, filters: $filters) {
          success
          message
          data {
            id
            ticketId
            aggregatorId
            ruleId
            disbursedAmount
            disbursedDate
            cashbackAmount
            grossCommissionAmount
            commissionAmount
            commissionType
            commissionRate
            status
            aggregatorRank
            productType
            provider
            calculatedAt
            approvedAt
            paidAt
            utrNumber
            paymentProofUrl
            adminNotes
            remarks
            createdAt
            updatedAt
            approvedBy
            paidBy
          }
          total
          page
          limit
          pages
        }
      }
    `,
      variables: {
        page: params?.page,
        limit: params?.limit,
        filters: params?.filters,
      },
    }).then(res => res.getCommissionTransactions),

  /**
   * Calculate commission for an application
   */
  calculateCommission: (input: CalculateCommissionInput) =>
    gqlFetch<{ calculateCommission: CommissionTransactionResponse }>({
      query: `
        mutation CalculateCommission($input: CalculateCommissionInput!) {
          calculateCommission(input: $input) {
            success
            message
            data {
              id
              ticketId
              aggregatorId
              disbursedAmount
              disbursedDate
              cashbackAmount
              grossCommissionAmount
              commissionAmount
              commissionType
              commissionRate
              status
              productType
              aggregatorRank
              calculatedAt
              createdAt
            }
          }
        }
      `,
      variables: { input },
    }).then(res => res.calculateCommission),

  /**
   * Update commission transaction status
   */
  updateTransactionStatus: (id: string, input: UpdateCommissionStatusInput) =>
    gqlFetch<{ updateCommissionStatus: CommissionTransactionResponse }>({
      query: `
      mutation UpdateCommissionStatus($id: ID!, $input: UpdateCommissionStatusInput!) {
        updateCommissionStatus(id: $id, input: $input) {
          success
          message
          data {
            id
            ticketId
            status
            utrNumber
            paymentProofUrl
            adminNotes
            remarks
            grossCommissionAmount
            commissionAmount
            disbursedAmount
            cashbackAmount
            approvedAt
            paidAt
            updatedAt
          }
        }
      }
    `,
      variables: { id, input },
    }).then(res => res.updateCommissionStatus),

  /**
   * Get commission trends by month for a given year
   */
  getCommissionTrendsByMonth: (year: number, aggregatorId?: string) =>
    gqlFetch<{
      getCommissionTrendsByMonth: Array<{
        month: string
        earned: number
        paid: number
        pending: number
      }>
    }>({
      query: `
        query GetCommissionTrendsByMonth($year: Int!, $aggregatorId: ID) {
          getCommissionTrendsByMonth(year: $year, aggregatorId: $aggregatorId) {
            month
            earned
            paid
            pending
          }
        }
      `,
      variables: { year, aggregatorId },
    }).then(res => res.getCommissionTrendsByMonth),
}
