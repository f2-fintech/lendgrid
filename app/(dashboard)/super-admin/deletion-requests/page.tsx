import { DeletionRequestsTable } from "@/components/dashboard/DeletionRequestsTable";

export default function SuperAdminDeletionRequestsPage() {
  return (
    <div className="p-1 sm:p-6 space-y-6">
      <DeletionRequestsTable />
    </div>
  );
}
