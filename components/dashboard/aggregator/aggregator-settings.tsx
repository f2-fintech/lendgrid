'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Settings, User, Bell, Shield, CreditCard, Building2, Mail, Phone, MapPin,
  Camera, Key, Smartphone, Globe, FileText, DollarSign, Users, Target, Eye, EyeOff,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { CardSkeleton } from '@/components/ui/loading-skeleton'

export function AggregatorSettings() {
  const [cardsLoading, setCardsLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [profileData, setProfileData] = useState({
    companyName: 'FinanceFlow Partners',
    contactPerson: 'Rajesh Kumar',
    email: 'rajesh@financeflow.com',
    phone: '+91 98765 43210',
    address: 'Mumbai, Maharashtra',
    gstNumber: '27ABCDE1234F1Z5',
    panNumber: 'ABCDE1234F'
  })

  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: true,
    marketing: false,
    applicationUpdates: true,
    commissionAlerts: true,
    payoutNotifications: true
  })

  const [preferences, setPreferences] = useState({
    autoSubmit: false,
    defaultLender: 'hdfc',
    commissionDisplay: 'percentage',
    dashboardView: 'detailed'
  })

  useEffect(() => {
    const t = setTimeout(() => {
      setCardsLoading(false)
    }, 2000)
    return () => clearTimeout(t)
  }, [])

  return (
    
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              Account Settings
            </h1>
            <p className="text-gray-400 mt-1">Manage your account preferences and configuration</p>
          </div>
          <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
            <Settings className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </motion.div>

        {/* Settings Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 bg-gray-900/50 border border-gray-800">
              <TabsTrigger value="profile" className="data-[state=active]:bg-gray-800">
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="business" className="data-[state=active]:bg-gray-800">
                <Building2 className="w-4 h-4 mr-2" />
                Business
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-gray-800">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-gray-800">
                <Shield className="w-4 h-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="preferences" className="data-[state=active]:bg-gray-800">
                <Settings className="w-4 h-4 mr-2" />
                Preferences
              </TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-6">
              {cardsLoading ? (
                <CardSkeleton headerLines={2} bodyHeight={456} />
              ) : (
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Profile Information</CardTitle>
                    <CardDescription className="text-gray-400">
                      Update your personal and contact information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Profile Picture */}
                    <div className="flex items-center space-x-6">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src="/placeholder.svg?height=96&width=96" />
                        <AvatarFallback className="bg-gray-800 text-gray-300 text-2xl">
                          RK
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Button variant="outline" className="border-gray-700 text-gray-300">
                          <Camera className="w-4 h-4 mr-2" />
                          Change Photo
                        </Button>
                        <p className="text-gray-400 text-sm mt-2">
                          JPG, GIF or PNG. 1MB max.
                        </p>
                      </div>
                    </div>

                    <Separator className="bg-gray-800" />

                    {/* Personal Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="contactPerson" className="text-gray-300">Contact Person</Label>
                        <Input
                          id="contactPerson"
                          value={profileData.contactPerson}
                          onChange={(e) => setProfileData({ ...profileData, contactPerson: e.target.value })}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-gray-300">Address</Label>
                        <Input
                          id="address"
                          value={profileData.address}
                          onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Business Settings */}
            <TabsContent value="business" className="space-y-6">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Business Information</CardTitle>
                  <CardDescription className="text-gray-400">
                    Manage your business details and compliance information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-gray-300">Company Name</Label>
                      <Input
                        id="companyName"
                        value={profileData.companyName}
                        onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gstNumber" className="text-gray-300">GST Number</Label>
                      <Input
                        id="gstNumber"
                        value={profileData.gstNumber}
                        onChange={(e) => setProfileData({ ...profileData, gstNumber: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="panNumber" className="text-gray-300">PAN Number</Label>
                      <Input
                        id="panNumber"
                        value={profileData.panNumber}
                        onChange={(e) => setProfileData({ ...profileData, panNumber: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessType" className="text-gray-300">Business Type</Label>
                      <Select defaultValue="partnership">
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="private_limited">Private Limited</SelectItem>
                          <SelectItem value="llp">LLP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator className="bg-gray-800" />

                  {/* Bank Details */}
                  <div>
                    <h4 className="text-white font-medium mb-4">Bank Account Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="bankName" className="text-gray-300">Bank Name</Label>
                        <Input
                          id="bankName"
                          placeholder="Enter bank name"
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountNumber" className="text-gray-300">Account Number</Label>
                        <Input
                          id="accountNumber"
                          placeholder="Enter account number"
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ifscCode" className="text-gray-300">IFSC Code</Label>
                        <Input
                          id="ifscCode"
                          placeholder="Enter IFSC code"
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountHolder" className="text-gray-300">Account Holder Name</Label>
                        <Input
                          id="accountHolder"
                          placeholder="Enter account holder name"
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div>
                    <h4 className="text-white font-medium mb-4">Verification Status</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-blue-400" />
                          <span className="text-gray-300">KYC Documents</span>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400">Verified</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Building2 className="w-5 h-5 text-blue-400" />
                          <span className="text-gray-300">Business Registration</span>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400">Verified</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="w-5 h-5 text-blue-400" />
                          <span className="text-gray-300">Bank Account</span>
                        </div>
                        <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Notification Preferences</CardTitle>
                  <CardDescription className="text-gray-400">
                    Choose how you want to receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Communication Channels */}
                  <div>
                    <h4 className="text-white font-medium mb-4">Communication Channels</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Mail className="w-5 h-5 text-blue-400" />
                          <div>
                            <p className="text-white font-medium">Email Notifications</p>
                            <p className="text-gray-400 text-sm">Receive notifications via email</p>
                          </div>
                        </div>
                        <Switch
                          checked={notifications.email}
                          onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                        />
                      </div>

                      <Separator className="bg-gray-800" />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Smartphone className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="text-white font-medium">SMS Notifications</p>
                            <p className="text-gray-400 text-sm">Receive notifications via SMS</p>
                          </div>
                        </div>
                        <Switch
                          checked={notifications.sms}
                          onCheckedChange={(checked) => setNotifications({ ...notifications, sms: checked })}
                        />
                      </div>

                      <Separator className="bg-gray-800" />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Bell className="w-5 h-5 text-purple-400" />
                          <div>
                            <p className="text-white font-medium">Push Notifications</p>
                            <p className="text-gray-400 text-sm">Receive push notifications in browser</p>
                          </div>
                        </div>
                        <Switch
                          checked={notifications.push}
                          onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-gray-800" />

                  {/* Notification Types */}
                  <div>
                    <h4 className="text-white font-medium mb-4">Notification Types</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-4 h-4 text-blue-400" />
                          <span className="text-gray-300">Application Updates</span>
                        </div>
                        <Switch
                          checked={notifications.applicationUpdates}
                          onCheckedChange={(checked) => setNotifications({ ...notifications, applicationUpdates: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <DollarSign className="w-4 h-4 text-green-400" />
                          <span className="text-gray-300">Commission Alerts</span>
                        </div>
                        <Switch
                          checked={notifications.commissionAlerts}
                          onCheckedChange={(checked) => setNotifications({ ...notifications, commissionAlerts: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="w-4 h-4 text-purple-400" />
                          <span className="text-gray-300">Payout Notifications</span>
                        </div>
                        <Switch
                          checked={notifications.payoutNotifications}
                          onCheckedChange={(checked) => setNotifications({ ...notifications, payoutNotifications: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Globe className="w-4 h-4 text-orange-400" />
                          <span className="text-gray-300">Marketing Communications</span>
                        </div>
                        <Switch
                          checked={notifications.marketing}
                          onCheckedChange={(checked) => setNotifications({ ...notifications, marketing: checked })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Security Settings</CardTitle>
                  <CardDescription className="text-gray-400">
                    Manage your account security and access controls
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Password Change */}
                  <div>
                    <h4 className="text-white font-medium mb-4">Change Password</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword" className="text-gray-300">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type={showPassword ? 'text' : 'password'}
                          className="bg-gray-800 border-gray-700 text-white"
                          placeholder="Enter Current Password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-15 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-gray-300">New Password</Label>
                        <Input
                          id="newPassword"
                          type={showPassword ? 'text' : 'password'}
                          className="bg-gray-800 border-gray-700 text-white"
                          placeholder="Enter New Password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-gray-300">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type={showPassword ? 'text' : 'password'}
                          className="bg-gray-800 border-gray-700 text-white"
                          placeholder="Confirm Password"
                        />
                      </div>
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                        Update Password
                      </Button>
                    </div>
                  </div>

                  <Separator className="bg-gray-800" />

                  {/* Two-Factor Authentication */}
                  <div>
                    <h4 className="text-white font-medium mb-4">Two-Factor Authentication</h4>
                    <div className="flex items-center justify-between p-4 border border-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Key className="w-5 h-5 text-yellow-400" />
                        <div>
                          <p className="text-white font-medium">2FA Authentication</p>
                          <p className="text-gray-400 text-sm">Add an extra layer of security to your account</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className="bg-green-500/20 text-green-400">Enabled</Badge>
                        <Button variant="outline" size="sm" className="border-gray-700 text-gray-300">
                          Configure
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Login Sessions */}
                  <div>
                    <h4 className="text-white font-medium mb-4">Active Sessions</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                        <div>
                          <p className="text-white font-medium">Current Session</p>
                          <p className="text-gray-400 text-sm">Chrome on Windows • Mumbai, India</p>
                          <p className="text-gray-400 text-xs">Last active: Now</p>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                        <div>
                          <p className="text-white font-medium">Mobile App</p>
                          <p className="text-gray-400 text-sm">Android App • Mumbai, India</p>
                          <p className="text-gray-400 text-xs">Last active: 2 hours ago</p>
                        </div>
                        <Button variant="outline" size="sm" className="border-red-500 text-red-400">
                          Revoke
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Settings */}
            <TabsContent value="preferences" className="space-y-6">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Application Preferences</CardTitle>
                  <CardDescription className="text-gray-400">
                    Customize your application behavior and defaults
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Application Defaults */}
                  <div>
                    <h4 className="text-white font-medium mb-4">Application Defaults</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="defaultLender" className="text-gray-300">Default Lender</Label>
                        <Select value={preferences.defaultLender} onValueChange={(value) => setPreferences({ ...preferences, defaultLender: value })}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="hdfc">HDFC Bank</SelectItem>
                            <SelectItem value="icici">ICICI Bank</SelectItem>
                            <SelectItem value="bajaj">Bajaj Finance</SelectItem>
                            <SelectItem value="axis">Axis Bank</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="commissionDisplay" className="text-gray-300">Commission Display</Label>
                        <Select value={preferences.commissionDisplay} onValueChange={(value) => setPreferences({ ...preferences, commissionDisplay: value })}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="amount">Amount</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-gray-800" />

                  {/* Dashboard Preferences */}
                  <div>
                    <h4 className="text-white font-medium mb-4">Dashboard Preferences</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">Auto-submit Applications</p>
                          <p className="text-gray-400 text-sm">Automatically submit applications when all documents are uploaded</p>
                        </div>
                        <Switch
                          checked={preferences.autoSubmit}
                          onCheckedChange={(checked) => setPreferences({ ...preferences, autoSubmit: checked })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dashboardView" className="text-gray-300">Dashboard View</Label>
                        <Select value={preferences.dashboardView} onValueChange={(value) => setPreferences({ ...preferences, dashboardView: value })}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="compact">Compact</SelectItem>
                            <SelectItem value="detailed">Detailed</SelectItem>
                            <SelectItem value="cards">Cards</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-gray-800" />

                  {/* Performance Targets */}
                  <div>
                    <h4 className="text-white font-medium mb-4">Performance Targets</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="monthlyTarget" className="text-gray-300">Monthly Application Target</Label>
                        <Input
                          id="monthlyTarget"
                          type="number"
                          defaultValue="50"
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="commissionTarget" className="text-gray-300">Monthly Commission Target</Label>
                        <Input
                          id="commissionTarget"
                          type="number"
                          defaultValue="200000"
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="approvalTarget" className="text-gray-300">Target Approval Rate (%)</Label>
                        <Input
                          id="approvalTarget"
                          type="number"
                          defaultValue="80"
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
  )
}
