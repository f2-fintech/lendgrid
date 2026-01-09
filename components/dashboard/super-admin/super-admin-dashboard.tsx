"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { TrendingUp, DollarSign, Building2, Users, Crown, CheckCircle, XCircle, Settings } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { CardSkeleton, ChartSkeleton } from '@/components/ui/loading-skeleton'
import { navigationPaths } from '@/lib/navigation'

const mockData = {
  metrics: {
    platformRevenue: 0,
    totalAggregators: 0,
    monthlyVolume: 0
  },
  revenueData: [
    { month: 'Jan', revenue: 0, volume: 0 },
    { month: 'Feb', revenue: 0, volume: 0 },
    { month: 'Mar', revenue: 0, volume: 0 },
    { month: 'Apr', revenue: 0, volume: 0 },
    { month: 'May', revenue: 0, volume: 0 },
    { month: 'Jun', revenue: 0, volume: 0 }
  ],
  lenderDistribution: [
    // { name: 'Banks', value: 8, color: '#007AFF' },
    // { name: 'NBFCs', value: 6, color: '#FFD700' },
    // { name: 'Fintech', value: 2, color: '#22c55e' }
  ],
  pendingApprovals: [],
  topPerformers: []
}

export function SuperAdminDashboard() {
  const [chartLoading, setChartLoading] = useState(true)
  const [cardsLoading, setCardsLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setChartLoading(false)
      setCardsLoading(false)
    }, 2000)
    return () => clearTimeout(t)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const MetricCard = ({ title, value, icon: Icon, trend, color }: any) => (
    <Card className="bg-gray-800/50 border-gray-700 hover:border-gold/50 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white mt-2">{value}</p>
            {trend && (
              <p className="text-sm text-green-400 mt-1 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                {trend}
              </p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Crown className="w-8 h-8 text-gold mr-3" />
            Super Admin Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Platform overview and management controls</p>
        </div>
        <div className="flex items-center space-x-4">
          <Link href={navigationPaths.superAdmin.settings}>
            <Button variant="outline" className="border-gray-600 text-black bg-gradient-to-r from-blue to-cyan-500">
              <Settings className="w-4 h-4 mr-2" />
              Platform Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      {cardsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Platform Revenue (1%)"
            value={formatCurrency(mockData.metrics.platformRevenue)}
            icon={DollarSign}
            trend="+15.3% from last month"
            color="bg-gold/20 text-gold"
          />
          <MetricCard
            title="Total Aggregators"
            value={mockData.metrics.totalAggregators}
            icon={Users}
            trend="+8 this month"
            color="bg-green-500/20 text-green-400"
          />
          <MetricCard
            title="Monthly Volume"
            value={formatCurrency(mockData.metrics.monthlyVolume)}
            icon={TrendingUp}
            trend="+22.1% from last month"
            color="bg-purple-500/20 text-purple-400"
          />
        </div>
      )}
      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Platform Revenue & Volume Trends</CardTitle>
              <CardDescription className="text-gray-400">
                Monthly platform revenue (1% commission) and total loan volume
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <ChartSkeleton height={320} />
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockData.revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis yAxisId="left" stroke="#9CA3AF" />
                      <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                        formatter={(value, name) => [
                          name === 'revenue' ? formatCurrency(value as number) : formatCurrency(value as number),
                          name === 'revenue' ? 'Platform Revenue' : 'Loan Volume'
                        ]}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        stroke="#FFD700"
                        strokeWidth={3}
                        dot={{ fill: '#FFD700', strokeWidth: 2, r: 4 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="volume"
                        stroke="#007AFF"
                        strokeWidth={3}
                        dot={{ fill: '#007AFF', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lender Distribution */}
        {/* <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Lender Distribution</CardTitle>
            <CardDescription className="text-gray-400">
              Breakdown by Institution Type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <ChartSkeleton height={256} />
            ) : (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mockData.lenderDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {mockData.lenderDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {mockData.lenderDistribution.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-gray-300">{item.name}</span>
                      </div>
                      <span className="text-white font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card> */}
      </div>

      {/* Tables Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        {cardsLoading ? (
          <CardSkeleton headerLines={2} bodyHeight={206} />
        ) : (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Pending Approvals</CardTitle>
              <CardDescription className="text-gray-400">
                Lender and aggregator onboarding requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockData.pendingApprovals.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${request.type === 'Lender' ? 'bg-blue/20 text-blue' : 'bg-green-500/20 text-green-400'
                        }`}>
                        {request.type === 'Lender' ? <Building2 className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{request.name}</p>
                        <p className="text-sm text-gray-400">{request.type} • {request.requestDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge
                        className={
                          request.priority === 'High'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-orange-500/20 text-orange-400'
                        }
                      >
                        {request.priority}
                      </Badge>
                      <div className="flex space-x-2">
                        <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Performers */}
        {cardsLoading ? (
          <CardSkeleton headerLines={2} bodyHeight={286} />
        ) : (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Top Performers</CardTitle>
              <CardDescription className="text-gray-400">
                Highest volume lenders and aggregators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockData.topPerformers.map((performer, index) => (
                  <div key={performer.name} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-gold to-yellow-500 rounded-lg flex items-center justify-center text-dark font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{performer.name}</p>
                        <p className="text-sm text-gray-400">{performer.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{formatCurrency(performer.volume)}</p>
                      <p className="text-sm text-gold">{formatCurrency(performer.commission)} commission</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
