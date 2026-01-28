"use client"

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  ClipboardList,
  IndianRupee,
  Banknote,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Users,
  Calendar,
  ArrowUpRight,
  Percent,
  DollarSign,
  Activity,
  Zap,
  Crown
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CardSkeleton, ChartSkeleton } from '@/components/ui/loading-skeleton'
import { CommissionStatus } from '@/lib'
import { navigationPaths } from '@/lib/navigation'

import { useAggregators } from '@/hooks/use-aggregators'
import { useToast } from '@/hooks/use-toast'
import { useCommissionTransactions, useCommissionRules } from '@/hooks/use-commissions'
import { useApplicationsRest } from '@/hooks/use-applications-rest'
import { useDisbursedTicketsByMonth } from '@/hooks/use-tickets-rest'

export function SuperAdminDashboard() {
  const router = useRouter()
  const { theme } = useTheme()

  // Fetch aggregators
  const { data: aggregatorsData, isLoading: aggregatorsLoading } = useAggregators({
    page: 1,
    limit: 5
  })

  // Fetch commission rules
  const { data: rulesData, isLoading: rulesLoading } = useCommissionRules({
    page: 1,
    limit: 4
  })

  // Fetch recent applications
  const { data: applicationsData, isLoading: applicationsLoading } = useApplicationsRest({
    page: 1,
    limit: 5
  })

  // Fetch commission transactions
  const { data: commissionsData, isLoading: commissionsLoading } = useCommissionTransactions({
    page: 1,
    limit: 5
  })

  // Fetch monthly disbursals
  const { data: disbursedByMonth, isLoading: chartLoading } = useDisbursedTicketsByMonth(
    new Date().getFullYear(),
    undefined,
    'super_admin'
  )

  // Calculate metrics
  const metrics = useMemo(() => {
    const aggregators = aggregatorsData?.results || []
    const totalApplications = applicationsData?.count || 0

    let totalCommissionEarned = 0
    let totalCommissionPaid = 0
    let totalCommissionPending = 0

    aggregators.forEach(agg => {
      totalCommissionEarned += agg.totalCommissionEarned || 0
    })

    commissionsData?.data?.forEach(tx => {
      if (tx.status === CommissionStatus.PAID) {
        totalCommissionPaid += tx.commissionAmount
      }
      if (
        tx.status === CommissionStatus.PENDING ||
        tx.status === CommissionStatus.CALCULATED
      ) {
        totalCommissionPending += tx.commissionAmount
      }
    })

    return {
      totalAggregators: aggregatorsData?.count || 0,
      activeAggregators: aggregators.filter(a => a.user?.status === 'ACTIVE').length,
      totalApplications,
      totalCommissionEarned,
      totalCommissionPaid,
      totalCommissionPending,
      avgCommissionRate: rulesData?.data?.length
        ? (rulesData.data.reduce((sum, r) => sum + r.commissionRate, 0) / rulesData.data.length).toFixed(2)
        : '0'
    }
  }, [aggregatorsData, applicationsData, commissionsData, rulesData])

  const chartData = useMemo(() => {
    return disbursedByMonth.map((item) => ({
      month: item.month.slice(0, 3),
      count: item.count,
    }))
  }, [disbursedByMonth])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-500/20 text-muted-foreground'
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-500/20 text-green-400'
      case 'PENDING_APPROVAL': return 'bg-orange-500/20 text-orange-400'
      case 'SUSPENDED':
      case 'INACTIVE': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-muted-foreground'
    }
  }

  const getCommissionStatusColor = (status: CommissionStatus) => {
    switch (status) {
      case CommissionStatus.PAID: return 'badge-success'
      case CommissionStatus.PENDING: return 'badge-warning'
      case CommissionStatus.CALCULATED: return 'bg-blue-500/20 text-blue-400'
      default: return 'badge-muted'
    }
  }

  const chartColors = {
    grid: theme === 'dark' ? '#374151' : '#e5e7eb',
    axis: theme === 'dark' ? '#9CA3AF' : '#6b7280',
    tooltipBg: theme === 'dark' ? '#1F2937' : '#ffffff',
    tooltipBorder: theme === 'dark' ? '#374151' : '#e5e7eb',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Crown className="w-8 h-8 text-yellow-500" />
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Real-time insights across the platform</p>
        </div>
        <Button variant="outline" className="border-border">
          <Calendar className="w-4 h-4 mr-2" />
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Button>
      </motion.div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="professional-card hover-lift bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Active Aggregators</p>
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-foreground">{metrics.activeAggregators}</p>
              <p className="text-sm text-muted-foreground mt-2">of {metrics.totalAggregators} total</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="professional-card hover-lift bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Fresh Applications</p>
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-foreground">{metrics.totalApplications}</p>
              <div className="flex items-center gap-1 mt-2 text-green-400 text-sm">
                <ArrowUpRight className="w-4 h-4" />
                <span>12% from last month</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="professional-card hover-lift bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Total Commission</p>
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(metrics.totalCommissionEarned)}</p>
              <div className="flex items-center gap-1 mt-2 text-green-400 text-sm">
                <ArrowUpRight className="w-4 h-4" />
                <span>8% from last month</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="professional-card hover-lift bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Avg Commission Rate</p>
                <Percent className="w-5 h-5 text-orange-400" />
              </div>
              <p className="text-3xl font-bold text-foreground">{metrics.avgCommissionRate}%</p>
              <p className="text-sm text-muted-foreground mt-2">across all products</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aggregators List Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="professional-card h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Users className="w-5 h-5 text-primary" />
                    Active Aggregators
                  </CardTitle>
                  <CardDescription className="mt-1 ml-7">Top performing aggregators</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(navigationPaths.superAdmin.aggregators)}
                  className="text-primary hover:text-primary/80"
                >
                  View All
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {aggregatorsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-muted/50 h-16 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {aggregatorsData?.results.slice(0, 5).map((agg, index) => (
                    <motion.div
                      key={agg._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-card/50 hover:bg-card border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                      onClick={() => router.push(`/super-admin/aggregators/profile/${agg._id}`)}
                    >
                      <Avatar className="w-10 h-10 border-2 border-primary/20">
                        <AvatarImage src={agg.user?.photoUrl} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                          {agg.companyName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{agg.companyName}</p>
                        <p className="text-xs text-muted-foreground truncate">{agg.user?.email}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(agg.user?.status)} variant="outline">
                          {agg.user?.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {agg.totalApplicationsSubmitted || 0} apps
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Commission Rules Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="professional-card h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Banknote className="w-5 h-5 text-accent" />
                    Active Commission Rules
                  </CardTitle>
                  <CardDescription className="mt-1 ml-7">Product-wise commission structure</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(navigationPaths.superAdmin.commission)}
                  className="text-accent hover:text-accent/80"
                >
                  Manage
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-muted/50 h-16 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {rulesData?.data?.slice(0, 4).map((rule, index) => (
                    <motion.div
                      key={rule.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-card/50 hover:bg-card border border-border/50 hover:border-accent/30 transition-all"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{rule.ruleName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {rule.productType}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(rule.minAmount)} - {formatCurrency(rule.maxAmount)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-accent">{rule.commissionRate}%</p>
                        <Badge className="bg-green-500/20 text-green-400 mt-1">
                          {rule.status}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="professional-card h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <FileText className="w-5 h-5 text-blue-400" />
                    Recent Applications
                  </CardTitle>
                  <CardDescription className="mt-1 ml-7">Latest loan applications</CardDescription>
                </div>
                {/* <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-400 hover:text-blue-400/80"
                  onClick={() => router.push(navigationPaths.superAdmin.commission)}
                >
                  View All
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button> */}
              </div>
            </CardHeader>
            <CardContent>
              {applicationsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-muted/50 h-16 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {applicationsData?.results?.slice(0, 5).map((app, index) => (
                    <motion.div
                      key={app.applicationId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-card/50 hover:bg-card border border-border/50 hover:border-blue-400/30 transition-all"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                          {app.customerName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{app.customerName}</p>
                          <p className="text-xs text-muted-foreground">{app.loanType} • {formatDate(app.applicationDate)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{formatCurrency(parseFloat(app.applicationAmount))}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {app.loanStatus}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Commission Transactions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="professional-card h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <IndianRupee className="w-5 h-5 text-green-400" />
                    Recent Commission Payouts
                  </CardTitle>
                  <CardDescription className="mt-1 ml-7">Latest commission transactions</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(navigationPaths.superAdmin.payouts)}
                  className="text-green-400 hover:text-green-400/80"
                >
                  View All
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {commissionsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-muted/50 h-16 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {commissionsData?.data?.slice(0, 5).map((comm, index) => (
                    <motion.div
                      key={comm.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-card/50 hover:bg-card border border-border/50 hover:border-green-400/30 transition-all"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">Ticket #{comm.ticketId}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">{comm.aggregatorName || 'N/A'}</p>
                          <span className="text-xs text-muted-foreground">•</span>
                          <p className="text-xs text-muted-foreground">{comm.productType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-400">{formatCurrency(comm.commissionAmount)}</p>
                        <Badge className={`${getCommissionStatusColor(comm.status)} text-xs mt-1`}>
                          {comm.status}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Analytics Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="professional-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Monthly Disbursement Analytics
                </CardTitle>
                <CardDescription className="mt-1 ml-7">Platform-wide monthly loan disbursements</CardDescription>
              </div>
              {/* <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  18% Growth YoY
                </Badge>
              </div> */}
            </div>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <ChartSkeleton height={320} />
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <defs>
                      <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} opacity={0.3} />
                    <XAxis
                      dataKey="month"
                      stroke={chartColors.axis}
                      style={{ fontSize: '12px', fontWeight: 500 }}
                    />
                    <YAxis
                      stroke={chartColors.axis}
                      allowDecimals={false}
                      style={{ fontSize: '12px', fontWeight: 500 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                      contentStyle={{
                        backgroundColor: chartColors.tooltipBg,
                        border: `1px solid ${chartColors.tooltipBorder}`,
                        borderRadius: '8px',
                      }}
                      formatter={(value) => [`${value} loans`, 'Disbursed']}
                    />
                    <Bar
                      dataKey="count"
                      fill="url(#colorBar)"
                      radius={[8, 8, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Commission Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="professional-card bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Commission Paid Out</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(metrics.totalCommissionPaid)}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="professional-card bg-gradient-to-br from-orange-500/5 to-yellow-500/5 border-orange-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Payout</p>
                <p className="text-2xl font-bold text-orange-400">{formatCurrency(metrics.totalCommissionPending)}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="professional-card bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Commission Transactions</p>
                <p className="text-2xl font-bold text-blue-400">{commissionsData?.total || 0}</p>
              </div>
              <Zap className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
