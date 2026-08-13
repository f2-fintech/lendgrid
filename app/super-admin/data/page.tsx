import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SuperAdminData } from "@/components/dashboard/super-admin/super-admin-data";

export default function SuperAdminDataPage() {
  return (
    <DashboardLayout userRole="super_admin">
      <SuperAdminData />
    </DashboardLayout>
  );
}
