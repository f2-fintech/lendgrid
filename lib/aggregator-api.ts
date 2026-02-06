import { gqlFetch } from './http-client'
import type {
  AggregatorProfile,
  AggregatorDocuments,
  BusinessType,
  KYCStatus,
  PaginatedResponse,
  CreateResponse,
  AggregatorType,
} from './api-types'

export const aggregatorProfileApi = {
  /**
   * Create aggregator profile
   */
  create: (payload: {
    userId: string
    companyName: string
    isOmsEnabled?: boolean
    aggregatorType?: AggregatorType
    businessType?: BusinessType
    registeredAddress?: string
    city?: string
    state?: string
    pincode?: string
    gstNumber?: string
    panNumber?: string
    tanNumber?: string
    cinNumber?: string
    websiteUrl?: string
    pocName?: string
    documents?: AggregatorDocuments
    bankName?: string
    accountNumber?: string
    ifscCode?: string
    accountHolderName?: string
    isBankVerified?: boolean
    teamMembers?: string[]
    totalApplicationsSubmitted?: number
    totalApplicationsDisbursed?: number
    totalCommissionEarned?: number
    totalPaidOut?: number
    pendingPayout?: number
    createdBy?: string
  }) =>
    gqlFetch<{ createAggregatorProfile: CreateResponse<AggregatorProfile> }>({
      query: `
        mutation CreateAggregatorProfile($createInput: CreateAggregatorProfileDto!) {
          createAggregatorProfile(createInput: $createInput) {
            success
            message
            aggregatorProfile {
              _id
              userId
              companyName
              rank
              businessType
              city
              state
              kycStatus
              createdAt
              createdBy
            }
          }
        }
      `,
      variables: { createInput: payload },
    }),

  /**
   * Get all aggregator profiles with pagination
   */
  findAll: (params?: { page?: number; limit?: number }) =>
    gqlFetch<{ findAllAggregatorProfiles: PaginatedResponse<AggregatorProfile> }>({
      query: `
        query FindAllAggregatorProfiles($paginationArgs: PaginationQuery!) {
          findAllAggregatorProfiles(paginationArgs: $paginationArgs) {
            success
            message
            results {
              _id
              userId
              companyName
              companyId
              aggregatorType
              isOmsEnabled
              rank
              businessType
              yearOfEstablishment
              city
              state
              pincode
              kycStatus
              totalApplicationsSubmitted
              totalApplicationsDisbursed
              totalCommissionEarned
              totalDisbursedAmount
              pendingPayout
              createdAt
              createdBy
              teamMemberUsers {
                _id
                username
                email
                contact
                status
                role
                }
              user {
                _id
                username
                email
                contact
                role
                status
                createdAt
                loginHistory
              }
            }
            count
            page
            pages
          }
        }
      `,
      variables: { paginationArgs: params || { page: 1, limit: 10 } },
    }),

  /**
   * Get aggregator profile by ID
   */
  findOne: (id: string) =>
    gqlFetch<{ findOneAggregatorProfile: AggregatorProfile }>({
      query: `
      query FindOneAggregatorProfile($id: ID!) {
        findOneAggregatorProfile(id: $id) {
          _id
          userId
          companyName
          companyId
          aggregatorType
          isOmsEnabled
          rank
          businessType
          yearOfEstablishment
          registeredAddress
          city
          state
          pincode
          gstNumber
          panNumber
          aadhaarNumber
          tanNumber
          cinNumber
          websiteUrl
          documents {
            panCard
            aadhaarFront
            aadhaarBack
            gstCertificate
            incorporationCertificate
            bankStatement
            cancelledCheque
            addressProof
          }
          kycStatus
          kycRejectionReason
          kycApprovedAt
          bankName
          accountNumber
          ifscCode
          accountHolderName
          totalApplicationsSubmitted
          totalApplicationsDisbursed
          totalDisbursedAmount
          totalCommissionEarned
          totalPaidOut
          pendingPayout
          createdAt
          updatedAt
          user {
            _id
            username
            email
            contact
            role
            status
            photoUrl
          }
          kycApprovedByUser {
            _id
            username
            email
            status
          }
          teamMemberUsers {
            _id
            username
            email
            contact
            role
            status
          }
        }
      }
    `,
      variables: { id },
    }),

  /**
   * Get current user's aggregator profile
   */
  getMyProfile: () =>
    gqlFetch<{ myAggregatorProfile: AggregatorProfile }>({
      query: `
        query MyAggregatorProfile {
          myAggregatorProfile {
            _id
            userId
            companyName
            companyId
            aggregatorType
            isOmsEnabled
            rank
            businessType
            city
            state
            kycStatus
            totalApplicationsSubmitted
            totalApplicationsDisbursed
            totalCommissionEarned
            pendingPayout
            createdAt
            updatedAt
            user {
              _id
              username
              email
              contact
              role
              status
              photoUrl
            }
          }
        }
      `,
    }),

  /**
   * Get aggregator profiles by KYC status
   */
  findByKycStatus: (kycStatus: KYCStatus, params?: { page?: number; limit?: number }) =>
    gqlFetch<{ aggregatorProfilesByKycStatus: PaginatedResponse<AggregatorProfile> }>({
      query: `
        query AggregatorProfilesByKycStatus($kycStatus: KYCStatus!, $paginationArgs: PaginationQuery!) {
          aggregatorProfilesByKycStatus(kycStatus: $kycStatus, paginationArgs: $paginationArgs) {
            success
            results {
              _id
              rank
              companyName
              city
              state
              kycStatus
              kycRejectionReason
              createdAt
              user {
                _id
                username
                email
                status
              }
            }
            count
            page
            pages
          }
        }
      `,
      variables: { kycStatus, paginationArgs: params || { page: 1, limit: 10 } },
    }),

  /**
   * Search aggregator profiles by company name
   */
  search: (searchTerm: string, params?: { page?: number; limit?: number }) =>
    gqlFetch<{ searchAggregatorProfiles: PaginatedResponse<AggregatorProfile> }>({
      query: `
        query SearchAggregatorProfiles($searchTerm: String!, $paginationArgs: PaginationQuery!) {
          searchAggregatorProfiles(searchTerm: $searchTerm, paginationArgs: $paginationArgs) {
            success
            results {
              _id
              companyName
              isOmsEnabled
              city
              state
              kycStatus
              createdAt
            }
            count
            page
            pages
          }
        }
      `,
      variables: { searchTerm, paginationArgs: params || { page: 1, limit: 10 } },
    }),

  /**
   * Update aggregator profile
   */
  update: (payload: {
    id: string
    companyName?: string
    isOmsEnabled?: boolean
    aggregatorType?: AggregatorType
    businessType?: BusinessType
    registeredAddress?: string
    city?: string
    state?: string
    pincode?: string
    gstNumber?: string
    panNumber?: string
    aadhaarNumber?: string
    websiteUrl?: string
    pocName?: string
    documents?: AggregatorDocuments
    bankName?: string
    accountNumber?: string
    ifscCode?: string
    accountHolderName?: string
    isBankVerified?: boolean
    teamMembers?: string[]
    totalApplicationsSubmitted?: number
    totalApplicationsDisbursed?: number
    totalCommissionEarned?: number
    totalPaidOut?: number
    pendingPayout?: number
    updatedBy?: string
  }) =>
    gqlFetch<{ updateAggregatorProfile: AggregatorProfile }>({
      query: `
        mutation UpdateAggregatorProfile($updateInput: UpdateAggregatorProfileDto!) {
          updateAggregatorProfile(updateInput: $updateInput) {
            _id
            companyName
            companyId
            kycStatus
            updatedAt
          }
        }
      `,
      variables: { updateInput: payload },
    }),

  /**
   * Update KYC status (Admin only)
   */
  updateKycStatus: (id: string, kycStatus: KYCStatus, rejectionReason?: string) =>
    gqlFetch<{ updateAggregatorKycStatus: AggregatorProfile }>({
      query: `
        mutation UpdateAggregatorKycStatus($id: ID!, $kycStatus: KYCStatus!, $rejectionReason: String) {
          updateAggregatorKycStatus(id: $id, kycStatus: $kycStatus, rejectionReason: $rejectionReason) {
            _id
            kycStatus
            kycRejectionReason
            kycApprovedAt
            updatedAt
          }
        }
      `,
      variables: { id, kycStatus, rejectionReason },
    }),

  /**
   * Add team member
   */
  addTeamMember: (id: string, userId: string) =>
    gqlFetch<{ addTeamMember: AggregatorProfile }>({
      query: `
        mutation AddTeamMember($id: ID!, $userId: ID!) {
          addTeamMember(id: $id, userId: $userId) {
            _id
            teamMembers
            updatedAt
          }
        }
      `,
      variables: { id, userId },
    }),

  /**
   * Remove team member
   */
  removeTeamMember: (id: string, userId: string) =>
    gqlFetch<{ removeTeamMember: AggregatorProfile }>({
      query: `
        mutation RemoveTeamMember($id: ID!, $userId: ID!) {
          removeTeamMember(id: $id, userId: $userId) {
            _id
            teamMembers
            updatedAt
          }
        }
      `,
      variables: { id, userId },
    }),

  /**
   * Delete aggregator profile (soft delete)
   */
  remove: (id: string) =>
    gqlFetch<{ removeAggregatorProfile: AggregatorProfile }>({
      query: `
        mutation RemoveAggregatorProfile($id: ID!) {
          removeAggregatorProfile(id: $id) {
            _id
            deletedAt
          }
        }
      `,
      variables: { id },
    }),
}
