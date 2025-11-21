"use client";

import { useParams } from "next/navigation";

import { AggregatorProfilePage } from '@/components/dashboard/super-admin/SuperAdminAggregatorProfile'

export default function AggregatorProfile() {
    const { id } = useParams();
    return <AggregatorProfilePage id={id} />
}
