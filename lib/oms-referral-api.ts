import { gqlFetch } from './http-client'

export interface OmsReferralItem {
  _id: string
  omsEmployeeId: string
  employeeCode?: string
  employeeName: string
  designation?: string
  referralCode: string
  signupLink: string
  referredPartnersCount: number
  totalApplicationsSubmitted: number
  totalDisbursedAmount: number
  createdAt: string
}

export interface OmsReferralMetrics {
  totalReferrers: number
  totalPartnersOnboarded: number
  totalDisbursedVolume: number
}

export interface PaginatedOmsReferrals {
  items: OmsReferralItem[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
  metrics: OmsReferralMetrics
}

export interface OmsPartnerItem {
  _id: string
  companyName: string
  companyId?: number
  kycStatus?: string
  totalApplicationsSubmitted?: number
  totalApplicationsApproved?: number
  totalDisbursedAmount?: number
  createdAt?: string
}

export interface OmsPartnersResponse {
  partners: OmsPartnerItem[]
  totalCount: number
}

export interface OmsReferralCodeResponse {
  referralCode: string
  employeeName: string
  designation?: string
  employeeCode?: string
  signupLink: string
}

export const omsReferralApi = {
  /**
   * Super Admin: Fetch all OMS staff referral codes with partner stats
   */
  getAll: (params?: { page?: number; limit?: number; searchTerm?: string }) =>
    gqlFetch<{ getAllOmsReferrals: PaginatedOmsReferrals }>({
      query: `
        query GetAllOmsReferrals($page: Int, $limit: Int, $searchTerm: String) {
          getAllOmsReferrals(page: $page, limit: $limit, searchTerm: $searchTerm) {
            items {
              _id
              omsEmployeeId
              employeeCode
              employeeName
              designation
              referralCode
              signupLink
              referredPartnersCount
              totalApplicationsSubmitted
              totalDisbursedAmount
              createdAt
            }
            totalCount
            page
            limit
            totalPages
            metrics {
              totalReferrers
              totalPartnersOnboarded
              totalDisbursedVolume
            }
          }
        }
      `,
      variables: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        searchTerm: params?.searchTerm || undefined,
      },
    }),

  /**
   * Super Admin / Staff: Get partners referred by an employee
   */
  getPartners: (omsEmployeeId?: string) =>
    gqlFetch<{ getOmsPartners: OmsPartnersResponse }>({
      query: `
        query GetOmsPartners($omsEmployeeId: String) {
          getOmsPartners(omsEmployeeId: $omsEmployeeId) {
            partners {
              _id
              companyName
              companyId
              kycStatus
              totalApplicationsSubmitted
              totalApplicationsApproved
              totalDisbursedAmount
              createdAt
            }
            totalCount
          }
        }
      `,
      variables: {
        omsEmployeeId: omsEmployeeId || undefined,
      },
    }),

  /**
   * OMS Staff: Fetch (or lazy-create) referral code for logged-in OMS staff
   */
  getMyReferralCode: () =>
    gqlFetch<{ getMyOmsReferralCode: OmsReferralCodeResponse }>({
      query: `
        query GetMyOmsReferralCode {
          getMyOmsReferralCode {
            referralCode
            employeeName
            designation
            employeeCode
            signupLink
          }
        }
      `,
    }),

  /**
   * OMS Staff / Admin: Fetch all loan applications of a referred partner
   */
  getPartnerApplications: (aggregatorProfileId: string) =>
    gqlFetch<{
      getOmsPartnerApplications: {
        totalCount: number
        applications: {
          _id: string
          applicantName?: string
          applicationId?: string
          loanAmount?: number
          loanType?: string
          status?: string
          createdAt?: string
        }[]
      }
    }>({
      query: `
        query GetOmsPartnerApplications($aggregatorProfileId: ID!) {
          getOmsPartnerApplications(aggregatorProfileId: $aggregatorProfileId) {
            totalCount
            applications {
              _id
              applicantName
              applicationId
              loanAmount
              loanType
              status
              createdAt
            }
          }
        }
      `,
      variables: { aggregatorProfileId },
    }),

  /**
   * Super Admin: Manually generate referral code for an employee
   */
  generateForEmployee: (
    payload:
      | string
      | {
          employeeId: string
          employeeName?: string
          employeeCode?: string
          designation?: string
        },
  ) => {
    const variables =
      typeof payload === 'string'
        ? { employeeId: payload }
        : {
            employeeId: payload.employeeId,
            employeeName: payload.employeeName || undefined,
            employeeCode: payload.employeeCode || undefined,
            designation: payload.designation || undefined,
          }

    return gqlFetch<{ generateOmsReferralForEmployee: OmsReferralCodeResponse }>({
      query: `
        mutation GenerateOmsReferralForEmployee(
          $employeeId: String!
          $employeeName: String
          $employeeCode: String
          $designation: String
        ) {
          generateOmsReferralForEmployee(
            employeeId: $employeeId
            employeeName: $employeeName
            employeeCode: $employeeCode
            designation: $designation
          ) {
            referralCode
            employeeName
            designation
            employeeCode
            signupLink
          }
        }
      `,
      variables,
    })
  },
}
