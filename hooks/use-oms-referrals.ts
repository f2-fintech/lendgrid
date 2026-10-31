import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { omsReferralApi } from '@/lib/oms-referral-api'
import { useToast } from '@/hooks/use-toast'

export function useAllOmsReferrals(params?: {
  page?: number
  limit?: number
  searchTerm?: string
}) {
  return useQuery({
    queryKey: queryKeys.omsReferrals.list(params),
    queryFn: async () => {
      const response = await omsReferralApi.getAll(params)
      const data = response.getAllOmsReferrals
      if (data?.items) {
        data.items = data.items.map((item) => ({
          ...item,
          employeeName:
            item.employeeName?.trim() ||
            item.employeeCode ||
            (item.omsEmployeeId ? `Employee #${item.omsEmployeeId.slice(-6)}` : 'OMS Staff'),
        }))
      }
      return data
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

export function useOmsPartnersForAdmin(omsEmployeeId?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.omsReferrals.partners(omsEmployeeId),
    queryFn: async () => {
      if (!omsEmployeeId) return null
      const response = await omsReferralApi.getPartners(omsEmployeeId)
      return response.getOmsPartners
    },
    enabled: !!omsEmployeeId && enabled,
    staleTime: 1000 * 60,
  })
}

export function useMyOmsReferralCode(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.omsReferrals.myCode(),
    queryFn: async () => {
      const response = await omsReferralApi.getMyReferralCode()
      return response.getMyOmsReferralCode
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  })
}

export function useMyOmsPartners(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.omsReferrals.partners(),
    queryFn: async () => {
      const response = await omsReferralApi.getPartners()
      return response.getOmsPartners
    },
    enabled,
    staleTime: 1000 * 30, // 30 seconds
    retry: 1,
  })
}

export function useOmsPartnerApplications(aggregatorProfileId?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.omsReferrals.partnerApps(aggregatorProfileId),
    queryFn: async () => {
      if (!aggregatorProfileId) return { applications: [], totalCount: 0 }
      const response = await omsReferralApi.getPartnerApplications(aggregatorProfileId)
      return response.getOmsPartnerApplications
    },
    enabled: !!aggregatorProfileId && enabled,
    staleTime: 1000 * 30,
    retry: 1,
  })
}

export function useGenerateOmsReferral() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (
      payload:
        | string
        | {
            employeeId: string
            employeeName?: string
            employeeCode?: string
            designation?: string
          },
    ) => {
      const response = await omsReferralApi.generateForEmployee(payload)
      return response.generateOmsReferralForEmployee
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.omsReferrals.all })
      toast({
        title: 'Referral Code Generated',
        description: `Successfully generated ${data.referralCode} for ${data.employeeName || 'employee'}`,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error?.message || 'Failed to generate referral code',
        variant: 'destructive',
      })
    },
  })
}
