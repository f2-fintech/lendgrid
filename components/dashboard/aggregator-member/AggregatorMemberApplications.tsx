'use client'

import { useState } from 'react'
import { ApplicationTicketsTabs } from '@/components/common/applications/ApplicationTicketsTabs'
import { AggregatorApplications } from '@/components/common/applications/ApplicationsTab'
import { TicketsTab } from '@/components/common/applications/TicketsTab'

interface AggregatorMemberApplicationsProps {
  startDate?: string | null;
  endDate?: string | null;
}

export function AggregatorMemberApplications({ startDate, endDate }: AggregatorMemberApplicationsProps = {}) {
  const [activeTab, setActiveTab] = useState<'applications' | 'tickets'>('applications')

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <ApplicationTicketsTabs
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'applications' ? (
        <AggregatorApplications startDate={startDate} endDate={endDate} />
      ) : (
        <TicketsTab startDate={startDate} endDate={endDate} />
      )}
    </div>
  )
}
