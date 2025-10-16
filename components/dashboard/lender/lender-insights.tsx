"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Users, DollarSign, FileText, Target, AlertTriangle, CheckCircle } from 'lucide-react'
import { CardSkeleton, ChartSkeleton } from '@/components/ui/loading-skeleton'

const monthlyData = [
  { month: 'Jan', applications: 120, approvals: 95, disbursals: 85, revenue: 2100000 },
  { month: 'Feb', applications: 135, approvals: 108, disbursals: 98, revenue: 2450000 },
  { month: 'Mar', applications: 148, approvals: 118, disbursals: 105, revenue: 2625000 },
  { month: 'Apr', applications: 162, approvals: 125, disbursals: 115, revenue: 2875000 },
  { month: 'May', applications: 178, approvals: 142, disbursals: 128, revenue: 3200000 },
  { month: 'Jun', applications: 195, approvals: 156, disbursals: 142, revenue: 3550000 }
]

const productPerformance = [
  { name: 'Personal Loan', applications: 245, approvals: 191, disbursals: 175, revenue: 4375000 },
  { name: 'Business Loan', applications: 89, approvals: 58, disbursals: 52, revenue: 1560000 },
  { name: 'Home Loan', applications: 156, approvals: 128, disbursals: 118, revenue: 1770000 },
  { name: 'Vehicle Loan', applications: 198, approvals: 168, disbursals: 155, revenue: 3100000 }
]

const customerSegments = [
  { name: 'Salaried', value: 45, color: '#3B82F6' },
  { name: 'Self-employed', value: 30, color: '#F59E0B' },
  { name: 'Business Owner', value: 20, color: '#10B981' },
  { name: 'Others', value: 5, color: '#6B7280' }
]

const riskAnalysis = [
  { category: 'Low Risk', count: 425, percentage: 68, color: '#10B981' },
  { category: 'Medium Risk', count: 165, percentage: 26, color: '#F59E0B' },
  { category: 'High Risk', count: 38, percentage: 6, color: '#EF4444' }
]

const aggregatorPerformance = [
  { name: 'FinanceHub', applications: 156, conversions: 125, conversionRate: 80.1, revenue: 3125000 },
  { name: 'LoanConnect', applications: 142, conversions: 98, conversionRate: 69.0, revenue: 2450000 },
  { name: 'CreditBridge', applications: 128, conversions: 89, conversionRate: 69.5, revenue: 2225000 },
  { name: 'MoneyLink', applications: 98, conversions: 72, conversionRate: 73.5, revenue: 1800000 },
  { name: 'QuickLoan', applications: 164, conversions: 118, conversionRate: 72.0, revenue: 2950000 }
]

export function LenderInsights() {
  const [timeRange, setTimeRange] = useState('6months')
  const [cardsLoading, setCardsLoading] = useState(true)

  const totalApplications = productPerformance.reduce((sum, p) => sum + p.applications, 0)
  const totalApprovals = productPerformance.reduce((sum, p) => sum + p.approvals, 0)
  const totalDisbursals = productPerformance.reduce((sum, p) => sum + p.disbursals, 0)
  const totalRevenue = productPerformance.reduce((sum, p) => sum + p.revenue, 0)
  const avgApprovalRate = (totalApprovals / totalApplications * 100).toFixed(1)
  const avgConversionRate = (totalDisbursals / totalApprovals * 100).toFixed(1)


  useEffect(() => {
    const t = setTimeout(() => {
      setCardsLoading(false)
    }, 2000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-white">Business Insights</h1>
            <p className="text-gray-400 mt-1">Comprehensive analytics and performance metrics</p>

          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48 bg-gradient-to-r from-blue to-cyan-500 border-none text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white text-black border-none">
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {cardsLoading ? (
            <CardSkeleton headerLines={2} bodyHeight={16} />
          ) : (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">


                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Applications</p>
                    <p className="text-2xl font-bold text-white">{totalApplications}</p>
                    <p className="text-green-500 text-sm flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +12.5% vs last period
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-blue" />
                </div>

              </CardContent>
            </Card>
          )}
          {cardsLoading ? (
            <CardSkeleton headerLines={2} bodyHeight={20} />
          ) : (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Approval Rate</p>
                    <p className="text-2xl font-bold text-white">{avgApprovalRate}%</p>
                    <p className="text-green-500 text-sm flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +3.2% vs last period
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>

              </CardContent>
            </Card>
          )}
          {cardsLoading ? (
            <CardSkeleton headerLines={2} bodyHeight={16} />
          ) : (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Conversion Rate</p>
                    <p className="text-2xl font-bold text-white">{avgConversionRate}%</p>
                    <p className="text-red-500 text-sm flex items-center mt-1">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      -1.8% vs last period
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-gold" />
                </div>

              </CardContent>
            </Card>
          )}

          {cardsLoading ? (
            <CardSkeleton headerLines={2} bodyHeight={16} />
          ) : (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Revenue</p>
                    <p className="text-2xl font-bold text-white">₹{(totalRevenue / 10000000).toFixed(1)}Cr</p>
                    <p className="text-green-500 text-sm flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +18.7% vs last period
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue" />
                </div>

              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Analytics Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-gray-900/50 border-gray-800">
              <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500">Overview</TabsTrigger>
              <TabsTrigger value="products" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500">Products</TabsTrigger>
              <TabsTrigger value="customers" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500">Customers</TabsTrigger>
              <TabsTrigger value="risk" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500">Risk Analysis</TabsTrigger>
              <TabsTrigger value="aggregators" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500">Aggregators</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <Card className="bg-gray-900/50 border-gray-800">

                  <CardHeader>
                    <CardTitle className="text-white">Monthly Trends</CardTitle>
                    <CardDescription className="text-gray-400">Application and approval trends over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {cardsLoading ? (
                      <ChartSkeleton height={254} />
                    ) :
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="month" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#F9FAFB'
                            }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="applications" stroke="#3B82F6" strokeWidth={2} name="Applications" />
                          <Line type="monotone" dataKey="approvals" stroke="#10B981" strokeWidth={2} name="Approvals" />
                          <Line type="monotone" dataKey="disbursals" stroke="#F59E0B" strokeWidth={2} name="Disbursals" />
                        </LineChart>
                      </ResponsiveContainer>
                    }
                  </CardContent>

                </Card>

                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Revenue Growth</CardTitle>
                    <CardDescription className="text-gray-400">Monthly revenue progression</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {cardsLoading ? (
                      <ChartSkeleton height={254} />
                    ) :
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="month" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#F9FAFB'
                            }}
                            formatter={(value) => [`₹${(value / 100000).toFixed(1)}L`, 'Revenue']}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="url(#colorRevenue)" />
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                        </AreaChart>
                      </ResponsiveContainer>
                    }
                  </CardContent>

                </Card>
              </div>
            </TabsContent>

            <TabsContent value="products" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Product Performance</CardTitle>
                    <CardDescription className="text-gray-400">Applications by product type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={productPerformance}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="applications" fill="#3B82F6" name="Applications" />
                        <Bar dataKey="approvals" fill="#10B981" name="Approvals" />
                        <Bar dataKey="disbursals" fill="#F59E0B" name="Disbursals" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Revenue by Product</CardTitle>
                    <CardDescription className="text-gray-400">Revenue distribution across products</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={productPerformance}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="revenue"
                        >
                          {productPerformance.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                          formatter={(value) => [`₹${(value / 100000).toFixed(1)}L`, 'Revenue']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="customers" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Customer Segments</CardTitle>
                    <CardDescription className="text-gray-400">Distribution by customer type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={customerSegments}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name} ${value}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {customerSegments.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Customer Insights</CardTitle>
                    <CardDescription className="text-gray-400">Key customer metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {customerSegments.map((segment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }}></div>
                          <span className="text-white font-medium">{segment.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{segment.value}%</p>
                          <p className="text-gray-400 text-sm">{Math.round(totalApplications * segment.value / 100)} customers</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="risk" className="space-y-6">

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <Card className="bg-gray-900/50 border-gray-800">

                  <CardHeader>
                    <CardTitle className="text-white">Risk Distribution</CardTitle>
                    <CardDescription className="text-gray-400">Portfolio risk analysis</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {riskAnalysis.map((risk, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium">{risk.category}</span>
                          <span className="text-gray-400">{risk.count} ({risk.percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${risk.percentage}%`,
                              backgroundColor: risk.color
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Risk Metrics</CardTitle>
                    <CardDescription className="text-gray-400">Key risk indicators</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                        <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">Default Rate</p>
                        <p className="text-white text-xl font-bold">2.3%</p>
                      </div>
                      <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">Recovery Rate</p>
                        <p className="text-white text-xl font-bold">87.5%</p>
                      </div>
                    </div>
                    <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                      <TrendingUp className="w-8 h-8 text-blue mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Portfolio Health Score</p>
                      <p className="text-white text-2xl font-bold">8.7/10</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

            </TabsContent>

            <TabsContent value="aggregators" className="space-y-6">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Aggregator Performance</CardTitle>
                  <CardDescription className="text-gray-400">Performance metrics by aggregator partner</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {aggregatorPerformance.map((aggregator, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-gray-800/50 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-white font-semibold">{aggregator.name}</h3>
                          <div className="flex items-center space-x-4">
                            <span className="text-gray-400 text-sm">Conversion: {aggregator.conversionRate}%</span>
                            <span className="text-white font-medium">₹{(aggregator.revenue / 100000).toFixed(1)}L</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Applications</p>
                            <p className="text-white font-medium">{aggregator.applications}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Conversions</p>
                            <p className="text-white font-medium">{aggregator.conversions}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Revenue</p>
                            <p className="text-white font-medium">₹{(aggregator.revenue / 100000).toFixed(1)}L</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-gold to-blue h-2 rounded-full transition-all duration-500"
                              style={{ width: `${aggregator.conversionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
  )
}
