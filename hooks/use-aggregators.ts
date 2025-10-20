import { useState, useEffect, useCallback } from 'react'
import { usersApi, applicationsApi } from '@/lib/api-client'

export interface Aggregator {
  _id: string
  username: string
  email: string
  contact: string
  status: string
  role: string
  profilePicture?: string
  companyName?: string
  address?: string
  totalApplications?: number
  approvedApplications?: number
  conversionRate?: number
  totalCommission?: number
  kycStatus?: string
  pincode: string
  gender: string
  dob: string
}

export interface AggregatorMetrics {
  totalAggregators: number
  activeAggregators: number
  pendingApprovals: number
  avgConversionRate: number
}

interface AggregatorsResponse {
  aggregators: Aggregator[]
  total: number
  pages: number
  metrics: AggregatorMetrics
}

export function useAggregators({ page, limit }: { page?: number; limit?: number }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AggregatorsResponse>({
    aggregators: [],
    total: 0,
    pages: 0,
    metrics: {
      totalAggregators: 0,
      activeAggregators: 0,
      pendingApprovals: 0,
      avgConversionRate: 0
    }
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await usersApi.findByRole('AGGREGATOR_ADMIN', {
        page: page || 1,
        limit: limit || 10
      })

      if (response.usersByRole && response.usersByRole.results.length !== 0) {
        const { results, count, pages } = response.usersByRole

        const transformedAggregators: Aggregator[] = await Promise.all(
          results.map(async (agg: any) => {
            let totalApplications = 0
            let approvedApplications = 0
            let totalCommission = 0

            try {
              const appResponse = await applicationsApi.list({
                aggregatorId: agg._id,
                limit: 1000
              })
              if (appResponse.applications) {
                const applications = appResponse.applications.results
                totalApplications = applications.length
                approvedApplications = applications.filter((app: any) =>
                  app.status === 'approved' || app.status === 'disbursed'
                ).length
                totalCommission = applications
                  .filter((app: any) => app.status === 'disbursed')
                  .reduce((sum: number, app: any) => sum + (app.expectedCommission || 0), 0)
              }
            } catch (error) {
              console.error(`Failed to fetch stats for aggregator ${agg._id}:`, error)
            }

            const conversionRate = totalApplications > 0
              ? (approvedApplications / totalApplications) * 100
              : 0

            return {
              ...agg,
              _id: agg._id,
              username: agg.username,
              email: agg.email,
              contact: agg.contact,
              status: agg.status,
              totalApplications,
              approvedApplications,
              conversionRate: Math.round(conversionRate * 10) / 10,
              totalCommission,
              kycStatus: agg.kycStatus || 'Under Review'
            }
          })
        )

        const newMetrics: AggregatorMetrics = {
          totalAggregators: count,
          activeAggregators: transformedAggregators.filter(agg => agg.status === 'ACTIVE').length,
          pendingApprovals: transformedAggregators.filter(agg => agg.status === 'PENDING').length,
          avgConversionRate: transformedAggregators.length > 0
            ? transformedAggregators.reduce((sum, agg) => sum + (agg.conversionRate || 0), 0) / transformedAggregators.length
            : 0
        }
        newMetrics.avgConversionRate = Math.round(newMetrics.avgConversionRate * 10) / 10

        setData({
          aggregators: transformedAggregators,
          total: count,
          pages: pages || Math.ceil(count / (limit || 10)),
          metrics: newMetrics
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching aggregators')
    } finally {
      setLoading(false)
    }
  }, [page, limit])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { ...data, loading, error, mutate: fetchData }
}
