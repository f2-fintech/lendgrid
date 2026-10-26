"use client";

import { useAuth } from '@/lib/auth';
import { normalizeApiUrl } from '@/lib/utils';
import MultiStepFormPage from '@/components/dashboard/aggregator/multi-step-application-form/MultiStepFormPage';

export default function NewApplicationPage() {
    const { loading, role } = useAuth();

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // For aggregator_member, route requests through lendgrid-server proxy (NEXT_PUBLIC_API_BASE_URL).
    // For other roles (like OMS Sales), route directly to f2fintech-server (NEXT_PUBLIC_WEB_URL).
    const apiBaseUrl = role === 'aggregator_member'
        ? normalizeApiUrl(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000')
        : normalizeApiUrl(process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:8080');

    return (
        <MultiStepFormPage
            apiBaseUrl={apiBaseUrl}
            providers={[
                'Let F2 Fintech decide your lender',
                'ABFL',
                'Axis',
                'Bajaj Finance',
                'Bajaj Market',
                'Bank of Baroda',
                'BOI',
                'Canara Bank',
                'Cholamandalam',
                'Credit Saison',
                'Deutsche bank',
                'Godrej',
                'HDFC',
                'HSBC Bank',
                'ICICI',
                'IDFC',
                'Indusind',
                'Incred',
                'Kotak Bank',
                'L&T',
                'Lending Kart',
                'Paysense',
                'PNB',
                'Poonawala',
                'SBI',
                'Shriram',
                'SMFG',
                'STANDARD Chartered Bank',
                'Tata',
                'YES Bank',
            ]}
        />
    );
}
