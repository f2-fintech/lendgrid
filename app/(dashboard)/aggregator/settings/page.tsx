"use client"

import { AggregatorSettings } from '@/components/dashboard/aggregator/aggregator-settings'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { KycForm } from '@/components/dashboard/aggregator/kyc-form'
import { SettingsForm } from '@/components/dashboard/aggregator/settings-form'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

export default function AggregatorSettingsPage() {
  return (
    <DashboardLayout userRole="aggregator">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-1">Manage your account settings and KYC documents</p>
        </div>
        <Tabs defaultValue="kyc">
          <TabsList>
            <TabsTrigger value="kyc">KYC</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="kyc">
            <Card>
              <CardHeader>
                <CardTitle>KYC Documents</CardTitle>
                <CardDescription>Upload your KYC documents for verification</CardDescription>
              </CardHeader>
              <CardContent>
                <KycForm />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Update your account settings</CardDescription>
              </CardHeader>
              <CardContent>
                <SettingsForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
