'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Building2 } from 'lucide-react';

import { FormProvider } from '@/components/dashboard/aggregator/multi-step-application-form/FormContext';
import { MultiStepFormContent } from '@/components/dashboard/aggregator/multi-step-application-form/MultiStepForm';
import { ThemeLogo } from '@/components/theme-logo';
import { ThemeToggle } from '@/components/theme-toggle';

const GET_AGGREGATOR_BY_COMPANY_ID = `
  query GetAggregatorByCompanyId($companyId: Int!) {
    getAggregatorByCompanyId(companyId: $companyId) {
      _id
      companyId
      companyName
      isOmsEnabled
    }
  }
`;

interface AggregatorPublicInfo {
    _id: string;
    companyId: number;
    companyName: string;
    isOmsEnabled: boolean;
}

const PROVIDERS = [
    'Let F2 Fintech decide your lender',
    'ABFL', 'Axis', 'Bajaj Finance', 'Bajaj Market', 'Bank of Baroda',
    'BOI', 'Canara Bank', 'Cholamandalam', 'Credit Saison', 'Deutsche bank',
    'Godrej', 'HDFC', 'HSBC Bank', 'ICICI', 'IDFC', 'Indusind', 'Incred',
    'Kotak Bank', 'L&T', 'Lending Kart', 'Paysense', 'PNB', 'Poonawala',
    'SBI', 'Shriram', 'SMFG', 'STANDARD Chartered Bank', 'Tata', 'YES Bank',
];

function ApplyPageContent() {
    const searchParams = useSearchParams();
    const companyIdStr = searchParams.get('company_id');
    const companyId = companyIdStr ? Number(companyIdStr) : NaN;
    const sourceParam = searchParams.get('source');
    const source = sourceParam ? decodeURIComponent(sourceParam) : undefined;

    const [aggregator, setAggregator] = useState<AggregatorPublicInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!companyId || isNaN(companyId)) {
            setError('Invalid company link. Please contact support.');
            setLoading(false);
            return;
        }

        const graphqlUrl = process.env.NEXT_PUBLIC_API_BASE_URL
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/graphql`
            : 'http://localhost:4000/graphql';

        fetch(graphqlUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: GET_AGGREGATOR_BY_COMPANY_ID,
                variables: { companyId },
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                const profile = data?.data?.getAggregatorByCompanyId;
                if (!profile) {
                    setError('Company not found. Please check the link and try again.');
                } else {
                    setAggregator(profile);
                }
            })
            .catch(() => {
                setError('Unable to load company details. Please try again later.');
            })
            .finally(() => setLoading(false));
    }, [companyId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-sm">Loading application form…</p>
                </div>
            </div>
        );
    }

    if (error || !aggregator) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-3 max-w-sm">
                    <Building2 className="w-12 h-12 mx-auto text-destructive" />
                    <h2 className="text-xl font-semibold text-foreground">Link Not Valid</h2>
                    <p className="text-muted-foreground text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header / Navbar with LendGrid & Partner Branding */}
            <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    {/* Left: LendGrid Branding */}
                    <div className="flex items-center gap-1.5 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm shrink-0">
                            <ThemeLogo alt="LendGrid" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
                        </div>
                        <span className="text-base sm:text-xl font-bold tracking-tight text-primary">LendGrid</span>
                    </div>

                    {/* Right: Theme Toggle & Partner Branding */}
                    <div className="flex items-center gap-2 sm:gap-4 text-right">
                        <ThemeToggle />
                        
                        <div className="h-6 w-[1px] bg-border mx-1 hidden sm:block"></div>

                        <div className="flex items-center gap-1.5 sm:gap-3">
                            <div className="flex flex-col justify-center items-end">
                                <p className="text-[8px] sm:text-[11px] text-muted-foreground leading-none mb-0.5 sm:mb-1 uppercase tracking-wider font-semibold">Partner</p>
                                <p className="text-[10px] sm:text-sm font-semibold text-foreground leading-tight max-w-[80px] sm:max-w-[150px] truncate" title={aggregator.companyName}>
                                    {aggregator.companyName}
                                </p>
                            </div>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form — passes guestCompanyId and aggregatorProfileId so MultiStepForm skips JWT logic */}
            <div className="max-w-6xl mx-auto p-6">
                <FormProvider>
                    <MultiStepFormContent
                        apiBaseUrl={process.env.NEXT_PUBLIC_WEB_URL || ''}
                        providers={PROVIDERS}
                        onClose={() => (window.location.href = '/')}
                        onSuccess={() => (window.location.href = '/')}
                        guestCompanyId={String(aggregator.companyId)}
                        aggregatorProfileId={aggregator._id}
                        guestIsOmsEnabled={aggregator.isOmsEnabled}
                        guestSource={source}
                    />
                </FormProvider>
            </div>
        </div>
    );
}

export default function PublicApplyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-sm">Loading application form…</p>
                </div>
            </div>
        }>
            <ApplyPageContent />
        </Suspense>
    );
}
