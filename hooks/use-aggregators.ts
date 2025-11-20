import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { aggregatorProfileApi } from '@/lib/aggregator-api'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/use-toast'
import type { KYCStatus, BusinessType, AggregatorDocuments } from '@/lib/api-types'

interface UseAggregatorsProps {
  page?: number
  limit?: number
  enabled?: boolean
}

/**
 * Fetch all aggregators
 */
export function useAggregators({ page = 1, limit = 10, enabled = true }: UseAggregatorsProps = {}) {
  return useQuery({
    queryKey: queryKeys.aggregators.list(page, limit),
    queryFn: async () => {
      const response = await aggregatorProfileApi.findAll({ page, limit })
      return response.findAllAggregatorProfiles
    },
    enabled,
  })
}

/**
 * Fetch single aggregator by ID
 */
export function useAggregator(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.aggregators.detail(id),
    queryFn: async () => {
      const response = await aggregatorProfileApi.findOne(id)
      return response.findOneAggregatorProfile
    },
    enabled: enabled && !!id,
  })
}

/**
 * Fetch current user's aggregator profile
 */
export function useMyAggregatorProfile(enabled = true) {
  return useQuery({
    queryKey: queryKeys.aggregators.myProfile(),
    queryFn: async () => {
      const response = await aggregatorProfileApi.getMyProfile()
      return response.myAggregatorProfile
    },
    enabled,
  })
}

/**
 * Fetch aggregators by KYC status
 */
export function useAggregatorsByKycStatus(
  kycStatus: KYCStatus,
  { page = 1, limit = 10, enabled = true }: UseAggregatorsProps = {}
) {
  return useQuery({
    queryKey: queryKeys.aggregators.byKycStatus(kycStatus, page, limit),
    queryFn: async () => {
      const response = await aggregatorProfileApi.findByKycStatus(kycStatus, { page, limit })
      return response.aggregatorProfilesByKycStatus
    },
    enabled: enabled && !!kycStatus,
  })
}

/**
 * Search aggregators
 */
export function useSearchAggregators(
  searchTerm: string,
  { page = 1, limit = 10, enabled = true }: UseAggregatorsProps = {}
) {
  return useQuery({
    queryKey: queryKeys.aggregators.search(searchTerm, page, limit),
    queryFn: async () => {
      const response = await aggregatorProfileApi.search(searchTerm, { page, limit })
      return response.searchAggregatorProfiles
    },
    enabled: enabled && !!searchTerm && searchTerm.length > 0,
  })
}

/**
 * Create aggregator profile
 */
export function useCreateAggregatorProfile() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (payload: {
      userId: string
      companyName: string
      businessType?: BusinessType
      registeredAddress?: string
      city?: string
      state?: string
      pincode?: string
      photo?: string
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
    }) => aggregatorProfileApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aggregators.all })
      toast({
        title: 'Success',
        description: 'Aggregator profile created successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create aggregator profile',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Update aggregator profile
 */
export function useUpdateAggregatorProfile() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (payload: {
      id: string
      companyName?: string
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
      updatedBy?: string
    }) => aggregatorProfileApi.update(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aggregators.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.aggregators.detail(variables.id) })
      toast({
        title: 'Success',
        description: 'Aggregator profile updated successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update aggregator profile',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Update aggregator KYC status
 */
export function useUpdateAggregatorKycStatus() {
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
    }) => aggregatorProfileApi.updateKycStatus(id, kycStatus, rejectionReason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aggregators.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.aggregators.detail(variables.id) })
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
 * Add team member (with detailed GraphQL error handling)
 */
export function useAddTeamMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      aggregatorProfileApi.addTeamMember(id, userId),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aggregators.detail(variables.id) });
      toast({
        title: 'Success',
        description: 'Team member added successfully.',
      });
    },

    onError: (error: Error) => {
      const msg = error.message || 'Failed to add team member';
      let friendly = msg;

      // Map GraphQL backend errors to friendly messages
      if (msg.includes('already part of another aggregator team')) {
        friendly = 'This user is already part of another aggregator team.';
      } else if (msg.includes('Only users with AGGREGATOR_MEMBER role')) {
        friendly = 'You can only add users with the Aggregator Member role.';
      } else if (msg.includes('User already added as team member')) {
        friendly = 'This user is already in your team.';
      } else if (msg.includes('not found')) {
        friendly = 'User or aggregator profile not found.';
      }

      toast({
        title: 'Error',
        description: friendly,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Remove team member
 */
export function useRemoveTeamMember() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      aggregatorProfileApi.removeTeamMember(id, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aggregators.detail(variables.id) })
      toast({
        title: 'Success',
        description: 'Team member removed successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove team member',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Delete aggregator profile
 */
export function useDeleteAggregatorProfile() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => aggregatorProfileApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aggregators.all })
      toast({
        title: 'Success',
        description: 'Aggregator profile deleted successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete aggregator profile',
        variant: 'destructive',
      })
    },
  })
}
