"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Building2, TrendingUp, Users, CreditCard, Plus, Edit, Trash2, CheckCircle, XCircle, FileText } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
// DashboardLayout is provided by the app/(dashboard)/layout.tsx group layout
import { CardSkeleton, ChartSkeleton } from '@/components/ui/loading-skeleton'

const mockData = {
  metrics: {
    totalProducts: 12,
    activeAggregators: 45,
    monthlyApplications: 1250,
    totalCommissionPaid: 2500000
  },
  products: [
    {
      id: 'PROD001',
      name: 'Personal Loan Premium',
      type: 'Personal Loan',
      interestRate: "",
      commissionPercent: 4,
      isActive: true,
      applications: 156
    },
    {
      id: 'PROD002',
      name: 'Home Loan Flexi',
      type: 'Home Loan',
      interestRate: "",
      commissionPercent: 3.5,
      isActive: true,
      applications: 89
    },
    {
      id: 'PROD003',
      name: 'Business Loan Express',
      type: 'Business Loan',
      interestRate: "",
      commissionPercent: 4.5,
      isActive: false,
      applications: 23
    }
  ],
  aggregatorPerformance: [
    { name: 'F2 Fintech', applications: 245, approvalRate: 78, commission: 125000 },
    { name: 'LoanKart', applications: 189, approvalRate: 82, commission: 98000 },
    { name: 'QuickLoan DSA', applications: 156, approvalRate: 75, commission: 87000 },
    { name: 'FinanceHub', applications: 134, approvalRate: 80, commission: 76000 }
  ],
  chartData: [
    { month: 'Jan', applications: 180, approvals: 144 },
    { month: 'Feb', applications: 220, approvals: 176 },
    { month: 'Mar', applications: 280, approvals: 224 },
    { month: 'Apr', applications: 190, approvals: 152 },
    { month: 'May', applications: 250, approvals: 200 },
    { month: 'Jun', applications: 300, approvals: 240 }
  ]
}

export function LenderDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [activeTab, setActiveTab] = useState('overview')
  const [cardsLoading, setCardsLoading] = useState(true)
  const [chartsLoading, setChartsLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setChartsLoading(false)
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

  const MetricCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <Card className="bg-gray-800/50 border-gray-700 hover:border-blue/50 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white mt-2">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
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
            <h1 className="text-3xl font-bold text-white">Lender Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage your loan products and track aggregator performance</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant={selectedTab === 'overview' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('overview')}
              className={selectedTab === 'overview' ? 'bg-blue text-white' : 'border-gray-600 text-gray-300'}
            >
              Overview
            </Button>
            <Button
              variant={selectedTab === 'products' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('products')}
              className={selectedTab === 'products' ? 'bg-blue text-white' : 'border-gray-600 text-gray-300'}
            >
              Products
            </Button>
            <Button
              variant={selectedTab === 'aggregators' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('aggregators')}
              className={selectedTab === 'aggregators' ? 'bg-blue text-white' : 'border-gray-600 text-gray-300'}
            >
              Aggregators
            </Button>
          </div>
        </div>

        {selectedTab === 'overview' && (
          <>
            {/* Metrics Cards */}
            {cardsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <CardSkeleton headerLines={2} bodyHeight={20} />
                <CardSkeleton headerLines={2} bodyHeight={20} />
                <CardSkeleton headerLines={2} bodyHeight={20} />
                <CardSkeleton headerLines={2} bodyHeight={20} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Total Products"
                  value={mockData.metrics.totalProducts}
                  icon={CreditCard}
                  color="bg-blue/20 text-blue"
                  subtitle="8 active products"
                />
                <MetricCard
                  title="Active Aggregators"
                  value={mockData.metrics.activeAggregators}
                  icon={Users}
                  color="bg-green-500/20 text-green-400"
                  subtitle="+5 this month"
                />
                <MetricCard
                  title="Monthly Applications"
                  value={mockData.metrics.monthlyApplications}
                  icon={FileText}
                  color="bg-gold/20 text-gold"
                  subtitle="78% approval rate"
                />
                <MetricCard
                  title="Commission Paid"
                  value={formatCurrency(mockData.metrics.totalCommissionPaid)}
                  icon={TrendingUp}
                  color="bg-purple-500/20 text-purple-400"
                  subtitle="This month"
                />
              </div>
            )}

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Application Trends</CardTitle>
                  <CardDescription className="text-gray-400">
                    Monthly application and approval statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {chartsLoading ? (
                    <ChartSkeleton height={254} />
                  ) :
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockData.chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="month" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '8px'
                            }}
                          />
                          <Bar dataKey="applications" fill="#007AFF" name="Applications" />
                          <Bar dataKey="approvals" fill="#FFD700" name="Approvals" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  }
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Top Performing Aggregators</CardTitle>
                  <CardDescription className="text-gray-400">
                    Based on application volume and approval rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {cardsLoading ? (
                    <CardSkeleton headerLines={2} bodyHeight={286} />
                  ) :
                    <div className="space-y-4">
                      {mockData.aggregatorPerformance.slice(0, 4).map((aggregator, index) => (
                        <div key={aggregator.name} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
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
                            <p className="text-green-400 font-semibold">{aggregator.approvalRate}%</p>
                            <p className="text-sm text-gray-400">{formatCurrency(aggregator.commission)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  }
                </CardContent>

              </Card>

            </div>
          </>
        )}

        {selectedTab === 'products' && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Loan Products</CardTitle>
                  <CardDescription className="text-gray-400">
                    Manage your loan products and commission rates
                  </CardDescription>
                </div>
                <Button className="bg-gradient-to-r from-blue to-cyan-500 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Product Name</TableHead>
                      <TableHead className="text-gray-300">Type</TableHead>
                      <TableHead className="text-gray-300">Interest Rate</TableHead>
                      <TableHead className="text-gray-300">Commission %</TableHead>
                      <TableHead className="text-gray-300">Applications</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockData.products.map((product) => (
                      <TableRow key={product.id} className="border-gray-700 hover:bg-gray-800/50">
                        <TableCell className="text-white font-medium">{product.name}</TableCell>
                        <TableCell className="text-gray-300">{product.type}</TableCell>
                        <TableCell className="text-white">{product.interestRate}%</TableCell>
                        <TableCell className="text-gold">{product.commissionPercent}%</TableCell>
                        <TableCell className="text-white">{product.applications}</TableCell>
                        <TableCell>
                          <Badge
                            variant={product.isActive ? 'default' : 'secondary'}
                            className={product.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}
                          >
                            {product.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" className="text-blue hover:text-white hover:bg-gray-700">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-400 hover:text-white hover:bg-gray-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedTab === 'aggregators' && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Aggregator Performance</CardTitle>
              <CardDescription className="text-gray-400">
                Track performance metrics for all connected aggregators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Aggregator Name</TableHead>
                      <TableHead className="text-gray-300">Applications</TableHead>
                      <TableHead className="text-gray-300">Approval Rate</TableHead>
                      <TableHead className="text-gray-300">Commission Paid</TableHead>
                      <TableHead className="text-gray-300">Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockData.aggregatorPerformance.map((aggregator) => (
                      <TableRow key={aggregator.name} className="border-gray-700 hover:bg-gray-800/50">
                        <TableCell className="text-white font-medium">{aggregator.name}</TableCell>
                        <TableCell className="text-white">{aggregator.applications}</TableCell>
                        <TableCell className="text-green-400">{aggregator.approvalRate}%</TableCell>
                        <TableCell className="text-white">{formatCurrency(aggregator.commission)}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              aggregator.approvalRate >= 80
                                ? 'bg-green-500/20 text-green-400'
                                : aggregator.approvalRate >= 70
                                  ? 'bg-gold/20 text-gold'
                                  : 'bg-red-500/20 text-red-400'
                            }
                          >
                            {aggregator.approvalRate >= 80 ? 'Excellent' : aggregator.approvalRate >= 70 ? 'Good' : 'Needs Improvement'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
  )
}
