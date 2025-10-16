"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Building2, CreditCard, Bell, Shield, Key, Smartphone, Globe, Mail, Phone, MapPin, Upload, Save, CheckCircle, AlertTriangle } from 'lucide-react'
import { CardSkeleton } from '@/components/ui/loading-skeleton'

export function LenderSettings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    pushNotifications: true,
    weeklyReports: true,
    monthlyReports: true,
    payoutAlerts: true,
    applicationAlerts: true,
    systemUpdates: false
  })

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    sessionTimeout: '30',
    apiAccess: false,
    ipWhitelist: false
  })
  const [cardsLoading, setCardsLoading] = useState(true)

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
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="text-gray-400 mt-1">Manage your account and business preferences</p>
          </div>
          <Button className="bg-gradient-to-r from-blue to-cyan-500 text-dark">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </motion.div>

        {/* Settings Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-gray-900/50 border-gray-800 grid w-full grid-cols-2 lg:grid-cols-5 space-x-2">
              <TabsTrigger value="profile" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500">
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="business" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500">
                <Building2 className="w-4 h-4 mr-2" />
                Business
              </TabsTrigger>
              <TabsTrigger value="banking" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500">
                <CreditCard className="w-4 h-4 mr-2" />
                Banking
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500">
                <Shield className="w-4 h-4 mr-2" />
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              {cardsLoading ? (
                <CardSkeleton headerLines={2} bodyHeight={350} />
              ) :
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Profile Information</CardTitle>
                    <CardDescription className="text-gray-400">Update your personal details and profile picture</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center space-x-6">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src="/placeholder.svg?height=96&width=96&text=JD" alt="Profile" />
                        <AvatarFallback className="bg-gradient-to-r from-gold to-blue text-dark text-xl">JD</AvatarFallback>
                      </Avatar>
                      <div>
                        <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Photo
                        </Button>
                        <p className="text-gray-400 text-sm mt-2">JPG, PNG or GIF. Max size 2MB.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-white">First Name</Label>
                        <Input id="firstName" defaultValue="John" className="bg-gray-800 border-gray-700 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-white">Last Name</Label>
                        <Input id="lastName" defaultValue="Doe" className="bg-gray-800 border-gray-700 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-white">Email Address</Label>
                        <Input id="email" type="email" defaultValue="john.doe@lender.com" className="bg-gray-800 border-gray-700 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-white">Phone Number</Label>
                        <Input id="phone" defaultValue="+91 98765 43210" className="bg-gray-800 border-gray-700 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="designation" className="text-white">Designation</Label>
                        <Input id="designation" defaultValue="Chief Lending Officer" className="bg-gray-800 border-gray-700 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department" className="text-white">Department</Label>
                        <Select defaultValue="lending">
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="lending">Lending Operations</SelectItem>
                            <SelectItem value="risk">Risk Management</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="operations">Operations</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              }
            </TabsContent>

            <TabsContent value="business" className="space-y-6">
              {cardsLoading ? (
                <CardSkeleton bodyHeight={254} />
              ) :
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Business Information</CardTitle>
                    <CardDescription className="text-gray-400">Manage your organization details and compliance status</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="companyName" className="text-white">Company Name</Label>
                        <Input id="companyName" defaultValue="ABC Financial Services Ltd." className="bg-gray-800 border-gray-700 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="registrationNumber" className="text-white">Registration Number</Label>
                        <Input id="registrationNumber" defaultValue="CIN: L65191MH2010PLC123456" className="bg-gray-800 border-gray-700 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gstNumber" className="text-white">GST Number</Label>
                        <Input id="gstNumber" defaultValue="27ABCDE1234F1Z5" className="bg-gray-800 border-gray-700 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="panNumber" className="text-white">PAN Number</Label>
                        <Input id="panNumber" defaultValue="ABCDE1234F" className="bg-gray-800 border-gray-700 text-white" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-white">Registered Address</Label>
                      <Textarea
                        id="address"
                        defaultValue="123 Business District, Financial Center, Mumbai - 400001, Maharashtra, India"
                        className="bg-gray-800 border-gray-700 text-white"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="website" className="text-white">Website</Label>
                        <Input id="website" defaultValue="https://abcfinancial.com" className="bg-gray-800 border-gray-700 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="industry" className="text-white">Industry Type</Label>
                        <Select defaultValue="nbfc">
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="nbfc">NBFC</SelectItem>
                            <SelectItem value="bank">Bank</SelectItem>
                            <SelectItem value="fintech">Fintech</SelectItem>
                            <SelectItem value="cooperative">Cooperative Society</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employees" className="text-white">Employee Count</Label>
                        <Select defaultValue="100-500">
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="1-10">1-10</SelectItem>
                            <SelectItem value="11-50">11-50</SelectItem>
                            <SelectItem value="51-100">51-100</SelectItem>
                            <SelectItem value="100-500">100-500</SelectItem>
                            <SelectItem value="500+">500+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-white font-semibold">Compliance Status</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-white">RBI License</span>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-white">CIBIL Membership</span>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            <span className="text-white">Audit Certificate</span>
                          </div>
                          <Badge className="bg-yellow-500/20 text-yellow-400">Expiring Soon</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-white">ISO Certification</span>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              }
            </TabsContent>

            <TabsContent value="banking" className="space-y-6">
              {cardsLoading ? (
                <CardSkeleton bodyHeight={254} />
              ) :
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Banking Details</CardTitle>
                    <CardDescription className="text-gray-400">Manage your bank accounts for commission payouts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-semibold">Primary Account</h3>
                        <Badge className="bg-blue/20 text-blue">Primary</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="bankName" className="text-white">Bank Name</Label>
                          <Input id="bankName" defaultValue="HDFC Bank" className="bg-gray-800 border-gray-700 text-white" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="accountNumber" className="text-white">Account Number</Label>
                          <Input id="accountNumber" defaultValue="****1234" className="bg-gray-800 border-gray-700 text-white" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ifscCode" className="text-white">IFSC Code</Label>
                          <Input id="ifscCode" defaultValue="HDFC0001234" className="bg-gray-800 border-gray-700 text-white" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="accountType" className="text-white">Account Type</Label>
                          <Select defaultValue="current">
                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              <SelectItem value="current">Current Account</SelectItem>
                              <SelectItem value="savings">Savings Account</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-800 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold">Secondary Accounts</h3>
                        <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                          Add Account
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div>
                            <p className="text-white font-medium">ICICI Bank - ****5678</p>
                            <p className="text-gray-400 text-sm">ICIC0005678 • Current Account</p>
                          </div>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                            Edit
                          </Button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div>
                            <p className="text-white font-medium">Axis Bank - ****9012</p>
                            <p className="text-gray-400 text-sm">UTIB0009012 • Current Account</p>
                          </div>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              }
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              {cardsLoading ? (
                <CardSkeleton bodyHeight={254} />
              ) :
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Notification Preferences</CardTitle>
                    <CardDescription className="text-gray-400">Choose how you want to receive updates and alerts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-white font-semibold">General Notifications</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">Email Alerts</p>
                            <p className="text-gray-400 text-sm">Receive important updates via email</p>
                          </div>
                          <Switch
                            checked={notifications.emailAlerts}
                            onCheckedChange={(checked) => setNotifications({ ...notifications, emailAlerts: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">SMS Alerts</p>
                            <p className="text-gray-400 text-sm">Get critical alerts via SMS</p>
                          </div>
                          <Switch
                            checked={notifications.smsAlerts}
                            onCheckedChange={(checked) => setNotifications({ ...notifications, smsAlerts: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">Push Notifications</p>
                            <p className="text-gray-400 text-sm">Browser push notifications</p>
                          </div>
                          <Switch
                            checked={notifications.pushNotifications}
                            onCheckedChange={(checked) => setNotifications({ ...notifications, pushNotifications: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-white font-semibold">Business Notifications</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">Application Alerts</p>
                            <p className="text-gray-400 text-sm">New loan applications and status updates</p>
                          </div>
                          <Switch
                            checked={notifications.applicationAlerts}
                            onCheckedChange={(checked) => setNotifications({ ...notifications, applicationAlerts: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">Payout Alerts</p>
                            <p className="text-gray-400 text-sm">Commission payout notifications</p>
                          </div>
                          <Switch
                            checked={notifications.payoutAlerts}
                            onCheckedChange={(checked) => setNotifications({ ...notifications, payoutAlerts: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-white font-semibold">Reports</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">Weekly Reports</p>
                            <p className="text-gray-400 text-sm">Weekly business performance summary</p>
                          </div>
                          <Switch
                            checked={notifications.weeklyReports}
                            onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReports: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">Monthly Reports</p>
                            <p className="text-gray-400 text-sm">Comprehensive monthly analytics</p>
                          </div>
                          <Switch
                            checked={notifications.monthlyReports}
                            onCheckedChange={(checked) => setNotifications({ ...notifications, monthlyReports: checked })}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              }
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              {cardsLoading ? (
                <CardSkeleton bodyHeight={254} />
              ) :
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Security Settings</CardTitle>
                    <CardDescription className="text-gray-400">Manage your account security and access controls</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-white font-semibold">Authentication</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">Two-Factor Authentication</p>
                            <p className="text-gray-400 text-sm">Add an extra layer of security to your account</p>
                          </div>
                          <Switch
                            checked={securitySettings.twoFactorAuth}
                            onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, twoFactorAuth: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">Session Timeout</p>
                            <p className="text-gray-400 text-sm">Automatically log out after inactivity</p>
                          </div>
                          <Select
                            value={securitySettings.sessionTimeout}
                            onValueChange={(value) => setSecuritySettings({ ...securitySettings, sessionTimeout: value })}
                          >
                            <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              <SelectItem value="15">15 min</SelectItem>
                              <SelectItem value="30">30 min</SelectItem>
                              <SelectItem value="60">1 hour</SelectItem>
                              <SelectItem value="120">2 hours</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-white font-semibold">API Access</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">API Access</p>
                            <p className="text-gray-400 text-sm">Enable API access for integrations</p>
                          </div>
                          <Switch
                            checked={securitySettings.apiAccess}
                            onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, apiAccess: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">IP Whitelist</p>
                            <p className="text-gray-400 text-sm">Restrict access to specific IP addresses</p>
                          </div>
                          <Switch
                            checked={securitySettings.ipWhitelist}
                            onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, ipWhitelist: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-white font-semibold">Password & Recovery</h3>
                      <div className="space-y-3">
                        <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                          <Key className="w-4 h-4 mr-2" />
                          Change Password
                        </Button>
                        <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                          <Smartphone className="w-4 h-4 mr-2" />
                          Update Recovery Phone
                        </Button>
                        <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                          <Mail className="w-4 h-4 mr-2" />
                          Update Recovery Email
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-white font-semibold">Recent Activity</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div>
                            <p className="text-white text-sm">Login from Mumbai, India</p>
                            <p className="text-gray-400 text-xs">Today at 2:30 PM • Chrome on Windows</p>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400">Current</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div>
                            <p className="text-white text-sm">Login from Mumbai, India</p>
                            <p className="text-gray-400 text-xs">Yesterday at 9:15 AM • Chrome on Windows</p>
                          </div>
                          <Badge variant="outline" className="border-gray-600 text-gray-400">Previous</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              }
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
  )
}
