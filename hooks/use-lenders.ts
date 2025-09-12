import { useState, useEffect } from 'react'
import { usersApi } from '@/lib/api-client'

interface LenderData {
  id: string
  name: string
  type: string
  status: string
  kycStatus: string
  contactPerson: string
  email: string
  phone: string
  address: string
  totalVolume: number
  productsCount: number
  avgCommission: number
  joinDate: string
  lastActivity: string
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get lenders list
        const response = await usersApi.findByRole('lender_admin', {
          page: page || 1,
          limit: limit || 10
        })

        // Transform the API data to match expected format
        const transformedLenders: LenderData[] = response.data.results.map((user: any) => ({
          id: user._id,
          name: user.username || 'Unknown',
          type: 'NBFC', // Default type since not in API response
          status: user.status === 'active' ? 'Active' : 'Inactive',
          kycStatus: 'Verified', // Default since not in API response
          contactPerson: user.username,
          email: user.email,
          phone: user.contact,
          address: user.address || 'Not provided',
          totalVolume: 0, // Not available in current API
          productsCount: 0, // Not available in current API
          avgCommission: 0, // Not available in current API
          joinDate: new Date(user.createdAt).toLocaleDateString('en-GB'),
          lastActivity: user.loginHistory?.length > 0 
            ? new Date(user.loginHistory[user.loginHistory.length - 1]).toLocaleDateString('en-GB')
            : 'Never'
        }))

        // Calculate metrics from transformed data
        const activeLenders = transformedLenders.filter(l => l.status === 'Active').length
        const pendingLenders = transformedLenders.filter(l => l.status === 'Pending').length

        setData({
          lenders: transformedLenders,
          total: response.data.count,
          pages: response.data.pages,
          metrics: {
            totalLenders: response.data.count,
            activeLenders: activeLenders,
            pendingApprovals: pendingLenders,
            avgCommissionRate: 4.2 // Static value until API provides this
          }
        })
      } catch (err) {
        console.error('Error fetching lenders:', err)
        setError(err instanceof Error ? err.message : 'An error occurred while fetching lenders')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [page, limit]) // Removed 'status' dependency as it's not defined

  return { ...data, loading, error }
}