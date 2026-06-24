import { DeletionRequestsTable } from "@/components/dashboard/DeletionRequestsTable";

export default function AggregatorDeletionRequestsPage() {
  return (
    <div className="p-1 sm:p-6 space-y-6">
      <DeletionRequestsTable />
    </div>
  );
}
