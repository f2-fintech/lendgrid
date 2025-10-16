import React from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  // Wrap all pages in the (dashboard) route group with the DashboardLayout
  return <DashboardLayout>{children}</DashboardLayout>
}
