import { gqlFetch } from './http-client'
import type {
  LenderProfile,
  LenderBranch,
  LenderDocuments,
  LenderType,
  KYCStatus,
  Status,
  PaginatedResponse,
  CreateResponse,
} from './api-types'

export const lenderProfileApi = {
  /**
   * Create lender profile
   */
  create: (payload: {
    userId: string
    lenderName: string
    lenderType?: LenderType
    registeredAddress?: string
    city?: string
    state?: string
    pincode?: string
    gstNumber?: string
    panNumber: string
    tanNumber?: string
    cinNumber?: string
    rbiLicenseNumber?: string
    websiteUrl?: string
    pocName?: string
    documents?: LenderDocuments
  }) =>
    gqlFetch<{ createLenderProfile: CreateResponse<LenderProfile> }>({
      query: `
        mutation CreateLenderProfile($createInput: CreateLenderProfileDto!) {
          createLenderProfile(createInput: $createInput) {
            success
            message
            lenderProfile {
              _id
              userId
              lenderName
              lenderType
              city
              state
              kycStatus
              createdAt
              updatedAt
            }
          }
        }
      `,
      variables: { createInput: payload },
    }),

  /**
   * Get all lender profiles with pagination
   */
  findAll: (params?: { page?: number; limit?: number }) =>
    gqlFetch<{ findAllLenderProfiles: PaginatedResponse<LenderProfile> }>({
      query: `
        query FindAllLenderProfiles($paginationArgs: PaginationQuery!) {
          findAllLenderProfiles(paginationArgs: $paginationArgs) {
            success
            message
            results {
              _id
              userId
              lenderName
              lenderType
              city
              state
              pincode
              kycStatus
              totalApplicationsReceived
              totalDisbursedAmount
              totalCommissionPaid
              pendingCommissionPayouts
              createdAt
              updatedAt
              user {
                _id
                username
                email
                role
                status
                contact
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
   * Get lender profile by ID
   */
  findOne: (id: string) =>
    gqlFetch<{ findOneLenderProfile: LenderProfile }>({
      query: `
        query FindOneLenderProfile($id: ID!) {
          findOneLenderProfile(id: $id) {
            _id
            userId
            lenderName
            lenderType
            registeredAddress
            city
            state
            pincode
            gstNumber
            panNumber
            tanNumber
            cinNumber
            rbiLicenseNumber
            websiteUrl
            pocName
            documents
            kycStatus
            kycRejectionReason
            kycApprovedAt
            branches
            totalApplicationsReceived
            totalDisbursedAmount
            totalCommissionPaid
            pendingCommissionPayouts
            createdAt
            updatedAt
            user {
              _id
              username
              email
              role
            }
            kycApprovedByUser {
              _id
              username
              email
            }
          }
        }
      `,
      variables: { id },
    }),

  /**
   * Get current user's lender profile
   */
  getMyProfile: () =>
    gqlFetch<{ myLenderProfile: LenderProfile }>({
      query: `
        query MyLenderProfile {
          myLenderProfile {
            _id
            userId
            lenderName
            lenderType
            city
            state
            kycStatus
            totalApplicationsReceived
            totalDisbursedAmount
            createdAt
            updatedAt
            user {
              _id
              username
              email
            }
          }
        }
      `,
    }),

  /**
   * Get lender profiles by KYC status
   */
  findByKycStatus: (kycStatus: KYCStatus, params?: { page?: number; limit?: number }) =>
    gqlFetch<{ lenderProfilesByKycStatus: PaginatedResponse<LenderProfile> }>({
      query: `
        query LenderProfilesByKycStatus($kycStatus: KYCStatus!, $paginationArgs: PaginationQuery!) {
          lenderProfilesByKycStatus(kycStatus: $kycStatus, paginationArgs: $paginationArgs) {
            success
            results {
              _id
              lenderName
              lenderType
              city
              state
              kycStatus
              kycRejectionReason
              createdAt
              user {
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
      variables: { kycStatus, paginationArgs: params || { page: 1, limit: 10 } },
    }),

  /**
   * Get lender profiles by type
   */
  findByType: (lenderType: LenderType, params?: { page?: number; limit?: number }) =>
    gqlFetch<{ lenderProfilesByType: PaginatedResponse<LenderProfile> }>({
      query: `
        query LenderProfilesByType($lenderType: LenderType!, $paginationArgs: PaginationQuery!) {
          lenderProfilesByType(lenderType: $lenderType, paginationArgs: $paginationArgs) {
            success
            results {
              _id
              lenderName
              lenderType
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
      variables: { lenderType, paginationArgs: params || { page: 1, limit: 10 } },
    }),

  /**
   * Search lender profiles by name
   */
  search: (searchTerm: string, params?: { page?: number; limit?: number }) =>
    gqlFetch<{ searchLenderProfiles: PaginatedResponse<LenderProfile> }>({
      query: `
        query SearchLenderProfiles($searchTerm: String!, $paginationArgs: PaginationQuery!) {
          searchLenderProfiles(searchTerm: $searchTerm, paginationArgs: $paginationArgs) {
            success
            results {
              _id
              lenderName
              lenderType
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
   * Update lender profile
   */
  update: (payload: {
    id: string
    lenderName?: string
    lenderType?: LenderType
    registeredAddress?: string
    city?: string
    state?: string
    pincode?: string
    gstNumber?: string
    panNumber?: string
    websiteUrl?: string
    pocName?: string
    documents?: LenderDocuments
  }) =>
    gqlFetch<{ updateLenderProfile: LenderProfile }>({
      query: `
        mutation UpdateLenderProfile($updateInput: UpdateLenderProfileDto!) {
          updateLenderProfile(updateInput: $updateInput) {
            _id
            lenderName
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
    gqlFetch<{ updateLenderKycStatus: LenderProfile }>({
      query: `
        mutation UpdateLenderKycStatus($id: ID!, $kycStatus: KYCStatus!, $rejectionReason: String) {
          updateLenderKycStatus(id: $id, kycStatus: $kycStatus, rejectionReason: $rejectionReason) {
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
   * Add branch to lender
   */
  addBranch: (id: string, branchId: string) =>
    gqlFetch<{ addBranchToLender: LenderProfile }>({
      query: `
        mutation AddBranchToLender($id: ID!, $branchId: ID!) {
          addBranchToLender(id: $id, branchId: $branchId) {
            _id
            branches
            updatedAt
          }
        }
      `,
      variables: { id, branchId },
    }),

  /**
   * Remove branch from lender
   */
  removeBranch: (id: string, branchId: string) =>
    gqlFetch<{ removeBranchFromLender: LenderProfile }>({
      query: `
        mutation RemoveBranchFromLender($id: ID!, $branchId: ID!) {
          removeBranchFromLender(id: $id, branchId: $branchId) {
            _id
            branches
            updatedAt
          }
        }
      `,
      variables: { id, branchId },
    }),

  /**
   * Delete lender profile (soft delete)
   */
  remove: (id: string) =>
    gqlFetch<{ removeLenderProfile: LenderProfile }>({
      query: `
        mutation RemoveLenderProfile($id: ID!) {
          removeLenderProfile(id: $id) {
            _id
            deletedAt
          }
        }
      `,
      variables: { id },
    }),
}

export const lenderBranchApi = {
  /**
   * Create lender branch
   */
  create: (payload: {
    lenderId: string
    branchName: string
    branchCode?: string
    address?: string
    city?: string
    state?: string
    pincode?: string
    contactPerson?: string
    contactEmail?: string
    contactPhone?: string
    managerId?: string
    status?: Status
  }) =>
    gqlFetch<{ createLenderBranch: CreateResponse<LenderBranch> }>({
      query: `
        mutation CreateLenderBranch($createInput: CreateLenderBranchDto!) {
          createLenderBranch(createInput: $createInput) {
            success
            message
            lenderBranch {
              _id
              lenderId
              branchName
              branchCode
              city
              state
              status
              createdAt
              updatedAt
            }
          }
        }
      `,
      variables: { createInput: payload },
    }),

  /**
   * Get all lender branches with pagination
   */
  findAll: (params?: { page?: number; limit?: number }) =>
    gqlFetch<{ findAllLenderBranches: PaginatedResponse<LenderBranch> }>({
      query: `
        query FindAllLenderBranches($paginationArgs: PaginationQuery!) {
          findAllLenderBranches(paginationArgs: $paginationArgs) {
            success
            message
            results {
              _id
              lenderId
              branchName
              branchCode
              city
              state
              pincode
              contactPerson
              contactPhone
              status
              createdAt
              updatedAt
              lender {
                _id
                lenderName
                lenderType
              }
              manager {
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
      variables: { paginationArgs: params || { page: 1, limit: 10 } },
    }),

  /**
   * Get lender branch by ID
   */
  findOne: (id: string) =>
    gqlFetch<{ findOneLenderBranch: LenderBranch }>({
      query: `
        query FindOneLenderBranch($id: ID!) {
          findOneLenderBranch(id: $id) {
            _id
            lenderId
            branchName
            branchCode
            address
            city
            state
            pincode
            contactPerson
            contactEmail
            contactPhone
            managerId
            status
            createdAt
            updatedAt
            lender {
              _id
              lenderName
              lenderType
              city
              state
            }
            manager {
              _id
              username
              email
              role
            }
          }
        }
      `,
      variables: { id },
    }),

  /**
   * Get branches by lender ID
   */
  findByLenderId: (lenderId: string, params?: { page?: number; limit?: number }) =>
    gqlFetch<{ lenderBranchesByLenderId: PaginatedResponse<LenderBranch> }>({
      query: `
        query LenderBranchesByLenderId($lenderId: ID!, $paginationArgs: PaginationQuery!) {
          lenderBranchesByLenderId(lenderId: $lenderId, paginationArgs: $paginationArgs) {
            success
            results {
              _id
              branchName
              branchCode
              city
              state
              contactPerson
              status
              createdAt
            }
            count
            page
            pages
          }
        }
      `,
      variables: { lenderId, paginationArgs: params || { page: 1, limit: 10 } },
    }),

  /**
   * Get current user's lender branches
   */
  getMyBranches: (params?: { page?: number; limit?: number }) =>
    gqlFetch<{ myLenderBranches: PaginatedResponse<LenderBranch> }>({
      query: `
        query MyLenderBranches($paginationArgs: PaginationQuery!) {
          myLenderBranches(paginationArgs: $paginationArgs) {
            success
            results {
              _id
              branchName
              branchCode
              city
              state
              contactPerson
              status
              createdAt
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
   * Get branches by status
   */
  findByStatus: (status: Status, params?: { page?: number; limit?: number }) =>
    gqlFetch<{ lenderBranchesByStatus: PaginatedResponse<LenderBranch> }>({
      query: `
        query LenderBranchesByStatus($status: Status!, $paginationArgs: PaginationQuery!) {
          lenderBranchesByStatus(status: $status, paginationArgs: $paginationArgs) {
            success
            results {
              _id
              branchName
              branchCode
              city
              state
              status
              createdAt
            }
            count
            page
            pages
          }
        }
      `,
      variables: { status, paginationArgs: params || { page: 1, limit: 10 } },
    }),

  /**
   * Get branches by location
   */
  findByLocation: (city?: string, state?: string, params?: { page?: number; limit?: number }) =>
    gqlFetch<{ lenderBranchesByLocation: PaginatedResponse<LenderBranch> }>({
      query: `
        query LenderBranchesByLocation($city: String, $state: String, $paginationArgs: PaginationQuery!) {
          lenderBranchesByLocation(city: $city, state: $state, paginationArgs: $paginationArgs) {
            success
            results {
              _id
              branchName
              branchCode
              city
              state
              contactPerson
              status
              createdAt
            }
            count
            page
            pages
          }
        }
      `,
      variables: { city, state, paginationArgs: params || { page: 1, limit: 10 } },
    }),

  /**
   * Search branches by name
   */
  search: (searchTerm: string, params?: { page?: number; limit?: number }) =>
    gqlFetch<{ searchLenderBranches: PaginatedResponse<LenderBranch> }>({
      query: `
        query SearchLenderBranches($searchTerm: String!, $paginationArgs: PaginationQuery!) {
          searchLenderBranches(searchTerm: $searchTerm, paginationArgs: $paginationArgs) {
            success
            results {
              _id
              branchName
              branchCode
              city
              state
              status
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
   * Update lender branch
   */
  update: (payload: {
    id: string
    branchName?: string
    branchCode?: string
    address?: string
    city?: string
    state?: string
    pincode?: string
    contactPerson?: string
    contactEmail?: string
    contactPhone?: string
    managerId?: string
    status?: Status
  }) =>
    gqlFetch<{ updateLenderBranch: LenderBranch }>({
      query: `
        mutation UpdateLenderBranch($updateInput: UpdateLenderBranchDto!) {
          updateLenderBranch(updateInput: $updateInput) {
            _id
            branchName
            branchCode
            status
            updatedAt
          }
        }
      `,
      variables: { updateInput: payload },
    }),

  /**
   * Assign manager to branch
   */
  assignManager: (id: string, managerId: string) =>
    gqlFetch<{ assignBranchManager: LenderBranch }>({
      query: `
        mutation AssignBranchManager($id: ID!, $managerId: ID!) {
          assignBranchManager(id: $id, managerId: $managerId) {
            _id
            managerId
            updatedAt
            manager {
              _id
              username
              email
            }
          }
        }
      `,
      variables: { id, managerId },
    }),

  /**
   * Remove manager from branch
   */
  removeManager: (id: string) =>
    gqlFetch<{ removeBranchManager: LenderBranch }>({
      query: `
        mutation RemoveBranchManager($id: ID!) {
          removeBranchManager(id: $id) {
            _id
            managerId
            updatedAt
          }
        }
      `,
      variables: { id },
    }),

  /**
   * Delete lender branch (soft delete)
   */
  remove: (id: string) =>
    gqlFetch<{ removeLenderBranch: LenderBranch }>({
      query: `
        mutation RemoveLenderBranch($id: ID!) {
          removeLenderBranch(id: $id) {
            _id
            deletedAt
          }
        }
      `,
      variables: { id },
    }),
}
