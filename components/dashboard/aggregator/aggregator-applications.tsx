'use client'

import { useState } from 'react'
import { ApplicationTicketsTabs } from '@/components/common/applications/ApplicationTicketsTabs'
import { AggregatorApplications } from '@/components/common/applications/ApplicationsTab'
import { TicketsTab } from '@/components/common/applications/TicketsTab'

export default function MainAggregatorApplications() {
  const [activeTab, setActiveTab] = useState<'applications' | 'tickets'>('applications')

  return (
    <div className="space-y-6">
      <ApplicationTicketsTabs
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'applications' ? (
        <AggregatorApplications />
      ) : (
        <TicketsTab />
      )}
    </div>
  )
}
