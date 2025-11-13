import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { lenderProfileApi, lenderBranchApi } from '@/lib/lender-api'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/use-toast'
import type { KYCStatus, LenderType, LenderDocuments, Status } from '@/lib/api-types'

interface UseLendersProps {
  page?: number
  limit?: number
  enabled?: boolean
}

/**
 * Fetch all lenders
 */
export function useLenders({ page = 1, limit = 10, enabled = true }: UseLendersProps = {}) {
  return useQuery({
    queryKey: queryKeys.lenders.list(page, limit),
    queryFn: async () => {
      const response = await lenderProfileApi.findAll({ page, limit })
      return response.findAllLenderProfiles
    },
    enabled,
  })
}

/**
 * Fetch single lender by ID
 */
export function useLender(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.lenders.detail(id),
    queryFn: async () => {
      const response = await lenderProfileApi.findOne(id)
      return response.findOneLenderProfile
    },
    enabled: enabled && !!id,
  })
}

/**
 * Fetch current user's lender profile
 */
export function useMyLenderProfile(enabled = true) {
  return useQuery({
    queryKey: queryKeys.lenders.myProfile(),
    queryFn: async () => {
      const response = await lenderProfileApi.getMyProfile()
      return response.myLenderProfile
    },
    enabled,
  })
}

/**
 * Fetch lenders by KYC status
 */
export function useLendersByKycStatus(
  kycStatus: KYCStatus,
  { page = 1, limit = 10, enabled = true }: UseLendersProps = {}
) {
  return useQuery({
    queryKey: queryKeys.lenders.byKycStatus(kycStatus, page, limit),
    queryFn: async () => {
      const response = await lenderProfileApi.findByKycStatus(kycStatus, { page, limit })
      return response.lenderProfilesByKycStatus
    },
    enabled: enabled && !!kycStatus,
  })
}

/**
 * Fetch lenders by type
 */
export function useLendersByType(
  lenderType: LenderType,
  { page = 1, limit = 10, enabled = true }: UseLendersProps = {}
) {
  return useQuery({
    queryKey: queryKeys.lenders.byType(lenderType, page, limit),
    queryFn: async () => {
      const response = await lenderProfileApi.findByType(lenderType, { page, limit })
      return response.lenderProfilesByType
    },
    enabled: enabled && !!lenderType,
  })
}

/**
 * Search lenders
 */
export function useSearchLenders(
  searchTerm: string,
  { page = 1, limit = 10, enabled = true }: UseLendersProps = {}
) {
  return useQuery({
    queryKey: queryKeys.lenders.search(searchTerm, page, limit),
    queryFn: async () => {
      const response = await lenderProfileApi.search(searchTerm, { page, limit })
      return response.searchLenderProfiles
    },
    enabled: enabled && !!searchTerm && searchTerm.length > 0,
  })
}

/**
 * Create lender profile
 */
export function useCreateLenderProfile() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (payload: {
      userId: string
      lenderName: string
      lenderType?: LenderType
      registeredAddress?: string
      city?: string
      state?: string
      pincode?: string
      photo?: string
      gstNumber?: string
      panNumber: string
      tanNumber?: string
      cinNumber?: string
      rbiLicenseNumber?: string
      websiteUrl?: string
      pocName?: string
      documents?: LenderDocuments
      branches?: string[]
      totalApplicationsReceived?: number
      totalDisbursedAmount?: number
      totalCommissionPaid?: number
      pendingCommissionPayouts?: number
      createdBy?: string
    }) => lenderProfileApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lenders.all })
      toast({
        title: 'Success',
        description: 'Lender profile created successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create lender profile',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Update lender profile
 */
export function useUpdateLenderProfile() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (payload: {
      id: string
      lenderName?: string
      lenderType?: LenderType
      registeredAddress?: string
      city?: string
      state?: string
      pincode?: string
      photo?: string
      gstNumber?: string
      panNumber: string
      tanNumber?: string
      cinNumber?: string
      rbiLicenseNumber?: string
      websiteUrl?: string
      pocName?: string
      documents?: LenderDocuments
      branches?: string[]
      totalApplicationsReceived?: number
      totalDisbursedAmount?: number
      totalCommissionPaid?: number
      pendingCommissionPayouts?: number
      createdBy?: string
    }) => lenderProfileApi.update(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lenders.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.lenders.detail(variables.id) })
      toast({
        title: 'Success',
        description: 'Lender profile updated successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update lender profile',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Update lender KYC status
 */
export function useUpdateLenderKycStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      id,
      kycStatus,
      rejectionReason,
    }: {
      id: string
      kycStatus: KYCStatus
      rejectionReason?: string
    }) => lenderProfileApi.updateKycStatus(id, kycStatus, rejectionReason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lenders.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.lenders.detail(variables.id) })
      toast({
        title: 'Success',
        description: 'KYC status updated successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update KYC status',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Delete lender profile
 */
export function useDeleteLenderProfile() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => lenderProfileApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lenders.all })
      toast({
        title: 'Success',
        description: 'Lender profile deleted successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete lender profile',
        variant: 'destructive',
      })
    },
  })
}

// LENDER BRANCHES HOOKS---------------------------------------
// Fetch all branches
export function useBranches({ page = 1, limit = 10, enabled = true }: UseLendersProps = {}) {
  return useQuery({
    queryKey: queryKeys.branches.list(page, limit),
    queryFn: async () => {
      const response = await lenderBranchApi.findAll({ page, limit })
      return response.findAllLenderBranches
    },
    enabled,
  })
}

/**
 * Fetch single branch by ID
 */
export function useBranch(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.branches.detail(id),
    queryFn: async () => {
      const response = await lenderBranchApi.findOne(id)
      return response.findOneLenderBranch
    },
    enabled: enabled && !!id,
  })
}

/**
 * Fetch branches by lender ID
 */
export function useBranchesByLender(
  lenderId: string,
  { page = 1, limit = 10, enabled = true }: UseLendersProps = {}
) {
  return useQuery({
    queryKey: queryKeys.branches.byLender(lenderId, page, limit),
    queryFn: async () => {
      const response = await lenderBranchApi.findByLenderId(lenderId, { page, limit })
      return response.lenderBranchesByLenderId
    },
    enabled: enabled && !!lenderId,
  })
}

/**
 * Fetch current user's branches
 */
export function useMyBranches({ page = 1, limit = 10, enabled = true }: UseLendersProps = {}) {
  return useQuery({
    queryKey: queryKeys.branches.myBranches(page, limit),
    queryFn: async () => {
      const response = await lenderBranchApi.getMyBranches({ page, limit })
      return response.myLenderBranches
    },
    enabled,
  })
}

/**
 * Create branch
 */
export function useCreateBranch() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (payload: {
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
    }) => lenderBranchApi.create(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.branches.byLender(variables.lenderId),
      })
      toast({
        title: 'Success',
        description: 'Branch created successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create branch',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Update branch
 */
export function useUpdateBranch() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (payload: {
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
    }) => lenderBranchApi.update(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.detail(variables.id) })
      toast({
        title: 'Success',
        description: 'Branch updated successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update branch',
        variant: 'destructive',
      })
    },
  })
}

/**
* Delete branch
*/
export function useDeleteBranch() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => lenderBranchApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all })
      toast({
        title: 'Success',
        description: 'Branch deleted successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete branch',
        variant: 'destructive',
      })
    },
  })
}
