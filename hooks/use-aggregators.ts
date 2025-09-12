import { useState, useEffect } from 'react'
import { usersApi } from '@/lib/api-client'

export function useAggregators({ page, limit }: { page?: number; limit?: number }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<{
    aggregators: any[]
    total: number
    pages: number
    metrics?: {
      totalAggregators: number
      activeAggregators: number
      pendingApprovals: number
      totalCommissions: number
    }
  }>({
    aggregators: [],
    total: 0,
    pages: 0
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Get aggregators list
        const response = await usersApi.findByRole('aggregator_admin', {
          page: page || 1,
          limit: limit || 10
        })

        // Get metrics
        const metrics = await usersApi.countByRole('aggregator_admin')

        setData({
          aggregators: response.data.results,
          total: response.data.count,
          pages: response.data.pages,
          metrics: {
            totalAggregators: response.data.count,
            activeAggregators: response.data.count, // We'll update this when we add status filtering
            pendingApprovals: 0, // We'll update this when we add status filtering
            totalCommissions: 0 // This should come from a separate API
          }
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [page, limit, status])

  return { ...data, loading, error }
}
