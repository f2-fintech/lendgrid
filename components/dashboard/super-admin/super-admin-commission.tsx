"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AggregatorType } from '@/lib/api-types'
import { CommissionRulesTab } from './commission-rules-tab'
import { Users, Building2 } from 'lucide-react'

export function SuperAdminCommission() {
  const [activeTab, setActiveTab] = useState<'sourcer' | 'channel_partner'>('sourcer')

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div className="w-full md:w-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Commission Management</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Configure and manage commission rules across the platform</p>
        </div>
      </motion.div>

      {/* Beautiful Full-Width Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'sourcer' | 'channel_partner')}>
        <TabsList className="flex flex-col sm:grid w-full sm:grid-cols-2 bg-muted/50 p-1 rounded-lg h-auto sm:h-14 gap-1 sm:gap-0">
          <TabsTrigger
            value="sourcer"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 rounded-md flex items-center justify-center gap-2 text-sm sm:text-base font-medium py-2.5 sm:py-0 whitespace-normal text-center h-auto sm:h-full"
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            Sourcer Commission Rules
          </TabsTrigger>
          <TabsTrigger
            value="channel_partner"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 rounded-md flex items-center justify-center gap-2 text-sm sm:text-base font-medium py-2.5 sm:py-0 whitespace-normal text-center h-auto sm:h-full"
          >
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            Channel Partner Commission Rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sourcer" className="mt-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <CommissionRulesTab aggregatorType={AggregatorType.SOURCER} />
          </motion.div>
        </TabsContent>

        <TabsContent value="channel_partner" className="mt-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <CommissionRulesTab aggregatorType={AggregatorType.CHANNEL_PARTNER} />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
