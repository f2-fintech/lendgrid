"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { normalizeApiUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import MultiStepFormPage from '@/components/dashboard/aggregator/multi-step-application-form/MultiStepFormPage';

function NewApplicationFormContent() {
    const { loading, role, user } = useAuth();
    const searchParams = useSearchParams();

    const partnerId = searchParams.get('partnerId') || searchParams.get('aggregatorProfileId') || undefined;
    const companyId = searchParams.get('companyId') || undefined;
    const partnerName = searchParams.get('partnerName') || undefined;

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const isOmsNonSales =
        user?.source === 'oms' &&
        user?.omsRole !== 'sales' &&
        !user?.isSales;

    if (isOmsNonSales && !partnerId && !companyId) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 bg-card border border-border/60 rounded-2xl max-w-lg mx-auto my-12 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    <Users className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Partner Selection Required</h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                    Non-sales staff cannot create direct self-applications. You can create applications for your onboarded Channel Partners from the <strong>Your Partners</strong> section.
                </p>
                <Button
                    onClick={() => window.location.href = '/lendgrid-sales/partners'}
                    className="gap-2"
                >
                    <Users className="w-4 h-4" />
                    Go to Your Partners
                </Button>
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
            guestCompanyId={companyId}
            aggregatorProfileId={partnerId}
            partnerName={partnerName}
            guestIsOmsEnabled={role === 'lendgrid_sales' || !!partnerId}
            guestSource={role === 'lendgrid_sales' ? 'oms' : undefined}
            onSuccess={() => {
                if (role === 'lendgrid_sales') {
                    window.location.href = '/lendgrid-sales/partners';
                } else {
                    window.location.href = '/aggregator/applications';
                }
            }}
        />
    );
}

export default function NewApplicationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <NewApplicationFormContent />
        </Suspense>
    );
}

