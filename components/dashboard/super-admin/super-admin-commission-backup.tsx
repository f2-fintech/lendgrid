"use client"

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AggregatorType } from '@/lib/api-types'
import { CommissionRulesTab } from './commission-rules-tab'

export function SuperAdminCommission() {
  const [activeTab, setActiveTab] = useState<'sourcer' | 'channel_partner'>('sourcer')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Commission Management</h1>
        <p className="text-muted-foreground mt-1">Configure and manage commission rules across the platform</p>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'sourcer' | 'channel_partner')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="sourcer">Sourcer Commission Rules</TabsTrigger>
          <TabsTrigger value="channel_partner">Channel Partner Commission Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="sourcer" className="mt-6">
          <CommissionRulesTab aggregatorType={AggregatorType.SOURCER} />
        </TabsContent>

        <TabsContent value="channel_partner" className="mt-6">
          <CommissionRulesTab aggregatorType={AggregatorType.CHANNEL_PARTNER} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
