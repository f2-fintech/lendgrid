"use client";

import { useAuth } from "@/lib/auth";
import { AggregatorMemberApplications } from "@/components/dashboard/aggregator-member/AggregatorMemberApplications";

export default function LendgridSalesPage() {
  const { loading, role, user } = useAuth("lendgrid_sales");

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || role !== "lendgrid_sales") {
    return null; // Will redirect via useAuth
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Sales Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back to LendGrid Sales.
        </p>
      </div>

      <AggregatorMemberApplications />
    </div>
  );
}
