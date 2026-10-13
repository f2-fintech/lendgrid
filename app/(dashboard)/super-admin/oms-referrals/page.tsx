import { SuperAdminOmsReferrals } from "@/components/dashboard/super-admin/super-admin-oms-referrals"

export const metadata = {
  title: "OMS Referrals Management | Super Admin Dashboard",
  description: "Track and generate referral links used by OMS operations staff to onboard Channel Partners.",
}

export default function SuperAdminOmsReferralsPage() {
  return <SuperAdminOmsReferrals />
}
