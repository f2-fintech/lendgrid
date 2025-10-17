"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Settings, Shield, Bell, Database, Mail, Globe, Users, CreditCard, AlertCircle, CheckCircle } from 'lucide-react'

export function SuperAdminSettings() {
  const [activeTab, setActiveTab] = useState('platform')

  const SettingCard = ({ title, description, children, icon: Icon }: any) => (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-gold" />
          </div>
          <div>
            <CardTitle className="text-white text-lg">{title}</CardTitle>
            <CardDescription className="text-gray-400">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white">System Settings</h1>
        <p className="text-gray-400 mt-1">Configure platform-wide settings and preferences</p>
      </motion.div>

      {/* Settings Tabs */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800 border-gray-700">
            <TabsTrigger value="platform" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500 data-[state=active]:text-dark">
              Platform
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500 data-[state=active]:text-dark">
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500 data-[state=active]:text-dark">
              Notifications
            </TabsTrigger>
            <TabsTrigger value="integrations" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500 data-[state=active]:text-dark">
              Integrations
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500 data-[state=active]:text-dark">
              Maintenance
            </TabsTrigger>
          </TabsList>

          {/* Platform Settings */}
          <TabsContent value="platform" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SettingCard
                title="Platform Configuration"
                description="Basic platform settings and information"
                icon={Globe}
              >
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Platform Name</Label>
                    <Input 
                      defaultValue="LendGrid" 
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Platform URL</Label>
                    <Input 
                      defaultValue="https://lendgrid.com" 
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Support Email</Label>
                    <Input 
                      defaultValue="support@lendgrid.com" 
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Platform Description</Label>
                    <Textarea 
                      defaultValue="Financial platform connecting loan aggregators with lenders"
                      className="bg-gray-900 border-gray-600 text-white"
                      rows={3}
                    />
                  </div>
                </div>
              </SettingCard>

              <SettingCard
                title="Business Rules"
                description="Configure platform business logic"
                icon={CreditCard}
              >
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Default Commission Rate (%)</Label>
                    <Input 
                      defaultValue="3.5" 
                      type="number"
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Minimum Loan Amount (₹)</Label>
                    <Input 
                      defaultValue="50000" 
                      type="number"
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Maximum Loan Amount (₹)</Label>
                    <Input 
                      defaultValue="10000000" 
                      type="number"
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Payout Frequency</Label>
                    <Select defaultValue="monthly">
                      <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SettingCard>
            </div>

            <div className="flex justify-end">
              <Button className="bg-gradient-to-r from-blue to-cyan-500 text-dark">
                Save Platform Settings
              </Button>
            </div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SettingCard
                title="Authentication Settings"
                description="Configure user authentication and access control"
                icon={Shield}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-400">Require 2FA for all admin users</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">Password Complexity</Label>
                      <p className="text-sm text-gray-400">Enforce strong password requirements</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div>
                    <Label className="text-gray-300">Session Timeout (minutes)</Label>
                    <Input 
                      defaultValue="30" 
                      type="number"
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Max Login Attempts</Label>
                    <Input 
                      defaultValue="5" 
                      type="number"
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                </div>
              </SettingCard>

              <SettingCard
                title="Data Protection"
                description="Configure data security and privacy settings"
                icon={Database}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">Data Encryption</Label>
                      <p className="text-sm text-gray-400">Encrypt sensitive data at rest</p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Enabled
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">Audit Logging</Label>
                      <p className="text-sm text-gray-400">Log all system activities</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div>
                    <Label className="text-gray-300">Data Retention Period (days)</Label>
                    <Input 
                      defaultValue="2555" 
                      type="number"
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">Automatic Backups</Label>
                      <p className="text-sm text-gray-400">Daily automated system backups</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </SettingCard>
            </div>

            <div className="flex justify-end">
              <Button className="bg-gradient-to-r from-blue to-cyan-500 text-dark">
                Save Security Settings
              </Button>
            </div>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SettingCard
                title="Email Notifications"
                description="Configure email notification preferences"
                icon={Mail}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">New User Registration</Label>
                      <p className="text-sm text-gray-400">Email notifications for new user signups</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">Payout Notifications</Label>
                      <p className="text-sm text-gray-400">Email alerts for payout processing</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">System Alerts</Label>
                      <p className="text-sm text-gray-400">Critical system notifications</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div>
                    <Label className="text-gray-300">SMTP Server</Label>
                    <Input 
                      defaultValue="smtp.lendgrid.com" 
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                </div>
              </SettingCard>

              <SettingCard
                title="SMS & WhatsApp"
                description="Configure messaging notification settings"
                icon={Bell}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">SMS Notifications</Label>
                      <p className="text-sm text-gray-400">Send SMS for critical updates</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">WhatsApp Integration</Label>
                      <p className="text-sm text-gray-400">WhatsApp business notifications</p>
                    </div>
                    <Switch />
                  </div>
                  <div>
                    <Label className="text-gray-300">SMS Provider</Label>
                    <Select defaultValue="twilio">
                      <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="aws">AWS SNS</SelectItem>
                        <SelectItem value="textlocal">TextLocal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300">WhatsApp Business API Key</Label>
                    <Input 
                      placeholder="Enter API key" 
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                </div>
              </SettingCard>
            </div>

            <div className="flex justify-end">
              <Button className="bg-gradient-to-r from-blue to-cyan-500 text-dark">
                Save Notification Settings
              </Button>
            </div>
          </TabsContent>

          {/* Integrations Settings */}
          <TabsContent value="integrations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SettingCard
                title="Payment Gateway"
                description="Configure payment processing integrations"
                icon={CreditCard}
              >
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Primary Gateway</Label>
                    <Select defaultValue="razorpay">
                      <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="razorpay">Razorpay</SelectItem>
                        <SelectItem value="payu">PayU</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="paytm">Paytm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300">API Key</Label>
                    <Input 
                      placeholder="Enter API key" 
                      type="password"
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Webhook URL</Label>
                    <Input 
                      defaultValue="https://api.lendgrid.com/webhooks/payment" 
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">Test Mode</Label>
                      <p className="text-sm text-gray-400">Use sandbox environment</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </SettingCard>

              <SettingCard
                title="Third-party APIs"
                description="External service integrations"
                icon={Globe}
              >
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Credit Bureau API</Label>
                    <Select defaultValue="cibil">
                      <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cibil">CIBIL</SelectItem>
                        <SelectItem value="experian">Experian</SelectItem>
                        <SelectItem value="equifax">Equifax</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300">KYC Verification</Label>
                    <Select defaultValue="aadhaar">
                      <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aadhaar">Aadhaar API</SelectItem>
                        <SelectItem value="pan">PAN Verification</SelectItem>
                        <SelectItem value="digilocker">DigiLocker</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">Real-time Verification</Label>
                      <p className="text-sm text-gray-400">Enable instant KYC verification</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div>
                    <Label className="text-gray-300">API Rate Limit (per minute)</Label>
                    <Input 
                      defaultValue="100" 
                      type="number"
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                </div>
              </SettingCard>
            </div>

            <div className="flex justify-end">
              <Button className="bg-gradient-to-r from-blue to-cyan-500 text-dark">
                Save Integration Settings
              </Button>
            </div>
          </TabsContent>

          {/* Maintenance Settings */}
          <TabsContent value="maintenance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SettingCard
                title="System Maintenance"
                description="Configure system maintenance and monitoring"
                icon={Settings}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">Maintenance Mode</Label>
                      <p className="text-sm text-gray-400">Enable system maintenance mode</p>
                    </div>
                    <Switch />
                  </div>
                  <div>
                    <Label className="text-gray-300">Maintenance Message</Label>
                    <Textarea 
                      defaultValue="System is under maintenance. Please try again later."
                      className="bg-gray-900 border-gray-600 text-white"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Scheduled Maintenance</Label>
                    <Input 
                      type="datetime-local"
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">Auto-restart Services</Label>
                      <p className="text-sm text-gray-400">Automatically restart failed services</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </SettingCard>

              <SettingCard
                title="System Monitoring"
                description="Monitor system health and performance"
                icon={AlertCircle}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">Health Monitoring</Label>
                      <p className="text-sm text-gray-400">Monitor system health metrics</p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-gray-300">Alert Threshold (CPU %)</Label>
                    <Input 
                      defaultValue="80" 
                      type="number"
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Memory Alert Threshold (%)</Label>
                    <Input 
                      defaultValue="85" 
                      type="number"
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Log Retention (days)</Label>
                    <Input 
                      defaultValue="30" 
                      type="number"
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                </div>
              </SettingCard>
            </div>

            <div className="flex justify-end">
              <Button className="bg-gradient-to-r from-blue to-cyan-500 text-dark">
                Save Maintenance Settings
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
