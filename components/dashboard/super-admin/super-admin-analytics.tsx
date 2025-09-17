"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, TrendingUp, Users, Building2, PieChart, Activity, Calendar, Download } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell,
  ComposedChart, Area, AreaChart
} from 'recharts'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ChartSkeleton, CardSkeleton } from "@/components/ui/loading-skeleton"

const mockData = {
  volumeTrends: [
    { month: 'Jan', volume: 18500000, applications: 1850, avgTicket: 100000, lenders: 12, aggregators: 45 },
    { month: 'Feb', volume: 22000000, applications: 2100, avgTicket: 105000, lenders: 13, aggregators: 48 },
    { month: 'Mar', volume: 28000000, applications: 2600, avgTicket: 108000, lenders: 14, aggregators: 52 },
    { month: 'Apr', volume: 19500000, applications: 1900, avgTicket: 103000, lenders: 14, aggregators: 55 },
    { month: 'May', volume: 31500000, applications: 2900, avgTicket: 109000, lenders: 15, aggregators: 58 },
    { month: 'Jun', volume: 38000000, applications: 3400, avgTicket: 112000, lenders: 16, aggregators: 62 },
    { month: 'Jul', volume: 40000000, applications: 3500, avgTicket: 112000, lenders: 16, aggregators: 62 },
    { month: 'Aug', volume: 35000000, applications: 3600, avgTicket: 112000, lenders: 16, aggregators: 62 },
    { month: 'Sep', volume: 45000000, applications: 3300, avgTicket: 112000, lenders: 16, aggregators: 62 },
    { month: 'Oct', volume: 38000000, applications: 3700, avgTicket: 112000, lenders: 16, aggregators: 62 }
  ],
  loanTypeDistribution: [
    { name: 'Personal Loan', value: 35, amount: 8750000, color: '#FFD700' },
    { name: 'Home Loan', value: 28, amount: 7000000, color: '#007AFF' },
    { name: 'Business Loan', value: 20, amount: 5000000, color: '#22c55e' },
    { name: 'Car Loan', value: 12, amount: 3000000, color: '#f97316' },
    { name: 'Others', value: 5, amount: 1250000, color: '#8b5cf6' }
  ],
  topPerformers: {
    lenders: [
      { name: 'HDFC Bank', volume: 5200000, applications: 520, growth: 15.2 },
      { name: 'ICICI Bank', volume: 4100000, applications: 410, growth: 12.8 },
      { name: 'Bajaj Finance', volume: 3800000, applications: 380, growth: 18.5 },
      { name: 'Axis Bank', volume: 3200000, applications: 320, growth: 8.9 },
      { name: 'Kotak Bank', volume: 2900000, applications: 290, growth: 22.1 }
    ],
    aggregators: [
      { name: 'F2 Fintech', volume: 3800000, applications: 380, growth: 25.3 },
      { name: 'LoanKart', volume: 2900000, applications: 290, growth: 18.7 },
      { name: 'QuickLoan DSA', volume: 2400000, applications: 240, growth: 15.9 },
      { name: 'FinanceHub', volume: 2100000, applications: 210, growth: 12.4 },
      { name: 'LoanExpress', volume: 1800000, applications: 180, growth: 20.8 }
    ]
  },
  geographicData: [
    { state: 'Maharashtra', volume: 6500000, percentage: 26 },
    { state: 'Karnataka', volume: 4200000, percentage: 17 },
    { state: 'Tamil Nadu', volume: 3800000, percentage: 15 },
    { state: 'Gujarat', volume: 3200000, percentage: 13 },
    { state: 'Delhi', volume: 2800000, percentage: 11 },
    { state: 'Others', volume: 4500000, percentage: 18 }
  ],
  conversionFunnel: [
    { stage: 'Applications', count: 12500, percentage: 100 },
    { stage: 'Document Verification', count: 10000, percentage: 80 },
    { stage: 'Credit Check', count: 8500, percentage: 68 },
    { stage: 'Approval', count: 7200, percentage: 58 },
    { stage: 'Disbursement', count: 6800, percentage: 54 }
  ]
}

export function SuperAdminAnalytics() {
  const [timeRange, setTimeRange] = useState('6m')
  const [activeTab, setActiveTab] = useState('overview')
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

  const COLORS = ['#FFD700', '#007AFF', '#22c55e', '#f97316', '#8b5cf6']

  return (
    <DashboardLayout userRole="super_admin">
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-white">Platform Analytics</h1>
            <p className="text-gray-400 mt-1">Comprehensive insights and performance metrics</p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1 Month</SelectItem>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="12m">12 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-gradient-to-r from-gold to-blue text-dark">
              <Download className="w-4 h-4 mr-2"/>
              Export Analytics
            </Button>
          </div>
        </motion.div>

        {/* Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gold data-[state=active]:text-dark">
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-gold data-[state=active]:text-dark">
              Performance
            </TabsTrigger>
            <TabsTrigger value="geographic" className="data-[state=active]:bg-gold data-[state=active]:text-dark">
              Geographic
            </TabsTrigger>
            <TabsTrigger value="conversion" className="data-[state=active]:bg-gold data-[state=active]:text-dark">
              Conversion
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Volume Trends */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Volume Trends & Growth</CardTitle>
                  <CardDescription className="text-gray-400">
                    Monthly loan volume, applications, and network growth
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {chartLoading ? (
                    <ChartSkeleton height={384} />
                  ) : (
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={mockData.volumeTrends}>
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
                              name === 'volume' ? formatCurrency(value as number) : value,
                              name === 'volume' ? 'Loan Volume' :
                                name === 'applications' ? 'Applications' :
                                  name === 'lenders' ? 'Lenders' : 'Aggregators'
                            ]}
                          />
                          <Area yAxisId="left" type="monotone" dataKey="volume" fill="url(#volumeGradient)" stroke="#FFD700" strokeWidth={2} />
                          <Bar yAxisId="right" dataKey="applications" fill="#007AFF" />
                          <Line yAxisId="right" type="monotone" dataKey="lenders" stroke="#22c55e" strokeWidth={2} />
                          <Line yAxisId="right" type="monotone" dataKey="aggregators" stroke="#f97316" strokeWidth={2} />
                          <defs>
                            <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#FFD700" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#FFD700" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Loan Type Distribution */}
            <div className="grid lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Loan Type Distribution</CardTitle>
                    <CardDescription className="text-gray-400">
                      Breakdown by loan categories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {chartLoading ? (
                      <ChartSkeleton height={256} />
                    ) : (
                      <>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={mockData.loanTypeDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {mockData.loanTypeDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#1F2937',
                                  border: '1px solid #374151',
                                  borderRadius: '8px'
                                }}
                                formatter={(value, name, props) => [
                                  `${value}% (${formatCurrency(props.payload.amount)})`,
                                  'Share'
                                ]}
                              />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 mt-4">
                          {mockData.loanTypeDistribution.map((item) => (
                            <div key={item.name} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: item.color }}
                                />
                                <span className="text-gray-300">{item.name}</span>
                              </div>
                              <span className="text-white font-semibold">{item.value}%</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                {cardsLoading ? (
                  <CardSkeleton headerLines={2} bodyHeight={224} />
                ) : (
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Key Metrics Summary</CardTitle>
                      <CardDescription className="text-gray-400">
                        Important performance indicators
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center">
                              <TrendingUp className="w-5 h-5 text-gold" />
                            </div>
                            <div>
                              <p className="text-white font-semibold">Avg Monthly Growth</p>
                              <p className="text-sm text-gray-400">Volume increase</p>
                            </div>
                          </div>
                          <span className="text-2xl font-bold text-green-400">+18.5%</span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue/20 rounded-lg flex items-center justify-center">
                              <Activity className="w-5 h-5 text-blue" />
                            </div>
                            <div>
                              <p className="text-white font-semibold">Platform Utilization</p>
                              <p className="text-sm text-gray-400">Active usage rate</p>
                            </div>
                          </div>
                          <span className="text-2xl font-bold text-blue">87%</span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                              <Users className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                              <p className="text-white font-semibold">Network Growth</p>
                              <p className="text-sm text-gray-400">New partners/month</p>
                            </div>
                          </div>
                          <span className="text-2xl font-bold text-green-400">+12</span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                              <BarChart3 className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                              <p className="text-white font-semibold">Avg Ticket Size</p>
                              <p className="text-sm text-gray-400">Per application</p>
                            </div>
                          </div>
                          <span className="text-2xl font-bold text-purple-400">₹1.1L</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Top Performers */}
            <div className="grid lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                {cardsLoading ? (
                  <CardSkeleton headerLines={2} bodyHeight={280} />
                ) : (
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Top Performing Lenders</CardTitle>
                      <CardDescription className="text-gray-400">
                        Ranked by loan volume and growth
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {mockData.topPerformers.lenders.map((lender, index) => (
                          <motion.div
                            key={lender.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-gradient-to-r from-gold to-yellow-500 rounded-lg flex items-center justify-center text-dark font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-semibold text-white">{lender.name}</p>
                                <p className="text-sm text-gray-400">{lender.applications} applications</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-semibold">{formatCurrency(lender.volume)}</p>
                              <p className="text-sm text-green-400">+{lender.growth}%</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                {cardsLoading ? (
                  <CardSkeleton headerLines={2} bodyHeight={280} />
                ) : (
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Top Performing Aggregators</CardTitle>
                      <CardDescription className="text-gray-400">
                        Ranked by loan volume and growth
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {mockData.topPerformers.aggregators.map((aggregator, index) => (
                          <motion.div
                            key={aggregator.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-semibold text-white">{aggregator.name}</p>
                                <p className="text-sm text-gray-400">{aggregator.applications} applications</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-semibold">{formatCurrency(aggregator.volume)}</p>
                              <p className="text-sm text-green-400">+{aggregator.growth}%</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="geographic" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Geographic Distribution</CardTitle>
                  <CardDescription className="text-gray-400">
                    Loan volume distribution across states
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {chartLoading ? (
                    <ChartSkeleton height={384} />
                  ) : (
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockData.geographicData} layout="horizontal">
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis type="number" stroke="#9CA3AF" />
                          <YAxis dataKey="state" type="category" stroke="#9CA3AF" width={100} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '8px'
                            }}
                            formatter={(value) => [formatCurrency(value as number), 'Volume']}
                          />
                          <Bar dataKey="volume" fill="url(#geoGradient)" radius={[0, 4, 4, 0]} />
                          <defs>
                            <linearGradient id="geoGradient" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#007AFF" />
                              <stop offset="100%" stopColor="#FFD700" />
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="conversion" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              {cardsLoading ? (
                <CardSkeleton headerLines={2} bodyHeight={256} />
              ) : (
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Conversion Funnel Analysis</CardTitle>
                    <CardDescription className="text-gray-400">
                      Application to disbursement conversion rates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {mockData.conversionFunnel.map((stage, index) => (
                        <motion.div
                          key={stage.stage}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="relative"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-medium">{stage.stage}</span>
                            <div className="text-right">
                              <span className="text-white font-semibold">{stage.count.toLocaleString()}</span>
                              <span className="text-gray-400 ml-2">({stage.percentage}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-3">
                            <motion.div
                              className="bg-gradient-to-r from-gold to-blue h-3 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${stage.percentage}%` }}
                              transition={{ duration: 1, delay: index * 0.2 }}
                            />
                          </div>
                          {index < mockData.conversionFunnel.length - 1 && (
                            <div className="text-center mt-2">
                              <span className="text-sm text-gray-400">
                                {((mockData.conversionFunnel[index + 1].count / stage.count) * 100).toFixed(1)}% conversion
                              </span>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
