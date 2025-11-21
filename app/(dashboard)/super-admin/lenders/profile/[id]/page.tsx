"use client";

import { useParams } from "next/navigation";

import { LenderProfilePage } from '@/components/dashboard/super-admin/SuperAdminLenderProfile'

export default function LenderProfile() {
    const { id } = useParams();
    return <LenderProfilePage id={id} />
}
