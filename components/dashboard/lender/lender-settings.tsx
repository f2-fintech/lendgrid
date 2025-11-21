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

  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState<string | null>(null)
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState<string | null>(null)
  const [panImagePreview, setPanImagePreview] = useState<string | null>(null)
  const [gstCertificatePreview, setGstCertificatePreview] = useState<string | null>(null)
  const [companyRegistrationCertificatePreview, setCompanyRegistrationCertificatePreview] = useState<string | null>(null)
  const [bankStatementPreview, setBankStatementPreview] = useState<string | null>(null)

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
            <TabsTrigger value="kyc" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500">
              <Bell className="w-4 h-4 mr-2" />
              KYC
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500">
              <Shield className="w-4 h-4 mr-2" />
              Preview
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
              <CardSkeleton bodyHeight={340} />
            ) : (
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Banking Details</CardTitle>
                  <CardDescription className="text-gray-400">Manage accounts used for commissions and payouts. Add multiple accounts, upload proof, and verify bank details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold">Primary Account</h3>
                      <div className="flex items-center space-x-3">
                        <Badge className="bg-green-700/20 text-green-300">Verified</Badge>
                        <Badge className="bg-blue/20 text-blue">Primary</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="accountHolder" className="text-white">Account Holder Name</Label>
                        <Input id="accountHolder" defaultValue="ABC Financial Services Ltd." className="bg-gray-800 border-gray-700 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankName" className="text-white">Bank Name</Label>
                        <Input id="bankName" defaultValue="HDFC Bank" className="bg-gray-800 border-gray-700 text-white" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="branchName" className="text-white">Branch</Label>
                        <Input id="branchName" defaultValue="Mumbai Main Branch" className="bg-gray-800 border-gray-700 text-white" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="accountNickname" className="text-white">Account Nickname</Label>
                        <Input id="accountNickname" defaultValue="Primary Payout" className="bg-gray-800 border-gray-700 text-white" />
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
                        <Label htmlFor="currency" className="text-white">Currency</Label>
                        <Select defaultValue="INR">
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="INR">INR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="branchAddress" className="text-white">Branch Address</Label>
                        <Textarea id="branchAddress" defaultValue="1 Financial Center, Fort, Mumbai - 400001" className="bg-gray-800 border-gray-700 text-white" rows={2} />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="bankStatement" className="text-gray-300">Bank Statement (latest)</Label>
                        <Input id="bankStatement" type="file" className="bg-gray-800 border-gray-700 text-white" onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0]
                            setBankStatementPreview(URL.createObjectURL(file))
                          }
                        }} />
                        {bankStatementPreview && <img src={bankStatementPreview} alt="Bank Statement Preview" className="mt-2 h-24 object-contain" />}
                        <p className="text-gray-400 text-sm mt-1">Upload a recent bank statement or cancelled cheque for verification (PDF/JPEG). Max 5MB.</p>
                      </div>

                      <div className="md:col-span-2 flex items-center justify-end space-x-3">
                        <div className="flex items-center space-x-2">
                          <Switch id="autoPayouts" defaultChecked />
                          <Label htmlFor="autoPayouts" className="text-gray-300">Enable automatic payouts</Label>
                        </div>
                        <Button className="bg-gradient-to-r from-blue to-cyan-500">Save Account</Button>
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
                          <p className="text-gray-400 text-sm">ICIC0005678 • Current Account • INR</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-yellow-700/20 text-yellow-300">Pending</Badge>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">Verify</Button>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">Make Primary</Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400">Delete</Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <div>
                          <p className="text-white font-medium">Axis Bank - ****9012</p>
                          <p className="text-gray-400 text-sm">UTIB0009012 • Current Account • INR</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-700/20 text-green-300">Verified</Badge>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">Edit</Button>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">Make Primary</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="kyc" className="space-y-6">
            {cardsLoading ? (
              <CardSkeleton bodyHeight={254} />
            ) :
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">KYC Settings</CardTitle>
                  <CardDescription className="text-gray-400">Manage your KYC documents and submissions</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="aadhaarNumber" className="text-gray-300">Aadhaar Number</Label>
                    <Input id="aadhaarNumber" className="bg-gray-800 border-gray-700 text-white" placeholder="Enter 12-digit Aadhaar number" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aadhaarFront" className="text-gray-300">Aadhaar Front Image</Label>
                    <Input id="aadhaarFront" type="file" className="bg-gray-800 border-gray-700 text-white" onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0]
                        setAadhaarFrontPreview(URL.createObjectURL(file))
                      }
                    }} />
                    {aadhaarFrontPreview && <img src={aadhaarFrontPreview} alt="Aadhaar Front Preview" className="mt-2 h-32" />}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aadhaarBack" className="text-gray-300">Aadhaar Back Image</Label>
                    <Input id="aadhaarBack" type="file" className="bg-gray-800 border-gray-700 text-white" onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0]
                        setAadhaarBackPreview(URL.createObjectURL(file))
                      }
                    }} />
                    {aadhaarBackPreview && <img src={aadhaarBackPreview} alt="Aadhaar Back Preview" className="mt-2 h-32" />}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="panNumber" className="text-gray-300">PAN Card Number</Label>
                    <Input id="panNumber" className="bg-gray-800 border-gray-700 text-white" placeholder="Enter 10-character PAN" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panImage" className="text-gray-300">PAN Card Image</Label>
                    <Input id="panImage" type="file" className="bg-gray-800 border-gray-700 text-white" onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0]
                        setPanImagePreview(URL.createObjectURL(file))
                      }
                    }} />
                    {panImagePreview && <img src={panImagePreview} alt="PAN Card Preview" className="mt-2 h-32" />}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gstNumber" className="text-gray-300">GST Number</Label>
                    <Input id="gstNumber" className="bg-gray-800 border-gray-700 text-white" placeholder="Enter 15-digit GSTIN" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gstCertificate" className="text-gray-300">GST Certificate</Label>
                    <Input id="gstCertificate" type="file" className="bg-gray-800 border-gray-700 text-white" onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0]
                        setGstCertificatePreview(URL.createObjectURL(file))
                      }
                    }} />
                    {gstCertificatePreview && <img src={gstCertificatePreview} alt="GST Certificate Preview" className="mt-2 h-32" />}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyRegistrationNumber" className="text-gray-300">Company Registration Number</Label>
                    <Input id="companyRegistrationNumber" className="bg-gray-800 border-gray-700 text-white" placeholder="e.g., CIN or FCRN" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyRegistrationCertificate" className="text-gray-300">Company Registration Certificate</Label>
                    <Input id="companyRegistrationCertificate" type="file" className="bg-gray-800 border-gray-700 text-white" onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0]
                        setCompanyRegistrationCertificatePreview(URL.createObjectURL(file))
                      }
                    }} />
                    {companyRegistrationCertificatePreview && <img src={companyRegistrationCertificatePreview} alt="Company Registration Certificate Preview" className="mt-2 h-32" />}
                  </div>

                  <div className="md:col-span-2 flex justify-end">
                    <Button className="bg-gradient-to-r from-blue to-cyan-500">Save KYC</Button>
                  </div>
                </CardContent>
              </Card>
            }
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            {cardsLoading ? (
              <CardSkeleton bodyHeight={254} />
            ) : (
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Profile Preview</CardTitle>
                  <CardDescription className="text-gray-400">Read-only summary of Profile, Business, Banking and KYC</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-800/40 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">Profile</h4>
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src="/placeholder.svg?height=64&width=64&text=JD" alt="Profile" />
                          <AvatarFallback className="bg-gradient-to-r from-gold to-blue text-dark">JD</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white font-medium">John Doe</p>
                          <p className="text-gray-400 text-sm">john.doe@lender.com</p>
                          <p className="text-gray-400 text-sm">+91 98765 43210</p>
                          <p className="text-gray-400 text-sm">Chief Lending Officer • Lending Operations</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-800/40 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">Business</h4>
                      <p className="text-white font-medium">ABC Financial Services Ltd.</p>
                      <p className="text-gray-400 text-sm">Registration: CIN: L65191MH2010PLC123456</p>
                      <p className="text-gray-400 text-sm">GST: 27ABCDE1234F1Z5 • PAN: ABCDE1234F</p>
                      <p className="text-gray-400 text-sm mt-2">123 Business District, Financial Center, Mumbai - 400001, Maharashtra, India</p>
                      <p className="text-gray-400 text-sm">Website: https://abcfinancial.com</p>
                      <p className="text-gray-400 text-sm">Industry: NBFC • Employees: 100-500</p>
                    </div>

                    <div className="p-4 bg-gray-800/40 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">Banking</h4>
                      <p className="text-white font-medium">Primary: HDFC Bank • ****1234</p>
                      <p className="text-gray-400 text-sm">IFSC: HDFC0001234 • Current Account</p>
                      <div className="mt-3 space-y-2">
                        <div className="p-3 bg-gray-800/50 rounded-lg">
                          <p className="text-white font-medium">ICICI Bank - ****5678</p>
                          <p className="text-gray-400 text-sm">ICIC0005678 • Current Account</p>
                        </div>
                        <div className="p-3 bg-gray-800/50 rounded-lg">
                          <p className="text-white font-medium">Axis Bank - ****9012</p>
                          <p className="text-gray-400 text-sm">UTIB0009012 • Current Account</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-800/40 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">KYC</h4>
                      <p className="text-gray-400 text-sm">Aadhaar Number: (not provided)</p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="text-center">
                          {aadhaarFrontPreview ? (
                            <img src={aadhaarFrontPreview} alt="Aadhaar Front" className="mx-auto h-28" />
                          ) : (
                            <div className="h-28 flex items-center justify-center bg-gray-800/30 rounded">No front</div>
                          )}
                          <p className="text-gray-400 text-xs mt-1">Aadhaar Front</p>
                        </div>
                        <div className="text-center">
                          {aadhaarBackPreview ? (
                            <img src={aadhaarBackPreview} alt="Aadhaar Back" className="mx-auto h-28" />
                          ) : (
                            <div className="h-28 flex items-center justify-center bg-gray-800/30 rounded">No back</div>
                          )}
                          <p className="text-gray-400 text-xs mt-1">Aadhaar Back</p>
                        </div>
                        <div className="text-center">
                          {panImagePreview ? (
                            <img src={panImagePreview} alt="PAN" className="mx-auto h-28" />
                          ) : (
                            <div className="h-28 flex items-center justify-center bg-gray-800/30 rounded">No PAN</div>
                          )}
                          <p className="text-gray-400 text-xs mt-1">PAN Image</p>
                        </div>
                        <div className="text-center">
                          {gstCertificatePreview ? (
                            <img src={gstCertificatePreview} alt="GST" className="mx-auto h-28" />
                          ) : (
                            <div className="h-28 flex items-center justify-center bg-gray-800/30 rounded">No GST</div>
                          )}
                          <p className="text-gray-400 text-xs mt-1">GST Certificate</p>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mt-3">Company Reg.: (not provided)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
