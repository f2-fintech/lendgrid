import { useState, useEffect, useCallback } from 'react'
import { usersApi } from '@/lib/api-client'

interface LenderData {
  id: string
  username: string
  email: string
  contact: string
  status: string
  lenderType?: string
  kycStatus?: string
  address?: string
  totalVolume?: number
  productsCount?: number
  avgCommission?: number
  createdAt: string
  loginHistory?: string
  companyName?: string
  pincode?: string
  gender?: string
  dob?: string
}

interface LendersResponse {
  lenders: LenderData[]
  total: number
  pages: number
  metrics?: {
    totalLenders: number
    activeLenders: number
    pendingApprovals: number
    avgCommissionRate: number
  }
}

export function useLenders({ page, limit }: { page?: number; limit?: number }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<LendersResponse>({
    lenders: [],
    total: 0,
    pages: 0
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get lenders list
      const response = await usersApi.findByRole('LENDER_ADMIN', {
        page: page || 1,
        limit: limit || 10
      })

      // Transform the API data to match expected format
      const transformedLenders: LenderData[] = response.usersByRole.results.map((user: any) => ({
        id: user._id,
        username: user.username || 'Unknown',
        lenderType: user.lenderType || 'N/A',
        status: user.status,
        kycStatus: 'Under Review',
        email: user.email,
        contact: user.contact,
        address: user.address || 'Not provided',
        totalVolume: 0,
        productsCount: 0, // Not available in current API
        avgCommission: 0, // Not available in current API
        createdAt: user.createdAt,
        lastActivity: user.loginHistory?.length > 0
          ? new Date(user.loginHistory[user.loginHistory.length - 1]).toLocaleDateString('en-GB')
          : 'Never',
        designation: user.companyName,
        pincode: user.pincode,
        gender: user.gender,
        dob: user.dob,
      }))

      // Calculate metrics from transformed data
      const activeLenders = transformedLenders.filter(l => l.status === 'Active').length
      const pendingLenders = transformedLenders.filter(l => l.status === 'Pending').length

      setData({
        lenders: transformedLenders,
        total: response.usersByRole.count,
        pages: response.usersByRole.pages,
        metrics: {
          totalLenders: response.usersByRole.count,
          activeLenders: activeLenders,
          pendingApprovals: pendingLenders,
          avgCommissionRate: 3.2
        }
      })
    } catch (err) {
      console.error('Error fetching lenders:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while fetching lenders')
    } finally {
      setLoading(false)
    }
  }, [page, limit])

  useEffect(() => {
    fetchData()
    console.log(data, 'data')
  }, [fetchData])

  return { ...data, loading, error, mutate: fetchData }
}