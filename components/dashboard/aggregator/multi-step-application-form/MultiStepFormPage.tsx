'use client';

import { FormProvider } from './FormContext';
import { MultiStepFormContent } from './MultiStepForm';

interface Props {
    apiBaseUrl: string;
    providers: string[];
    /** Guest/public mode props — forwarded from /apply/[companyId] page */
    guestCompanyId?: string;
    aggregatorProfileId?: string;
    guestIsOmsEnabled?: boolean;
}

export default function MultiStepFormPage({ apiBaseUrl, providers, guestCompanyId, aggregatorProfileId, guestIsOmsEnabled }: Props) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-6xl mx-auto p-6">
                <FormProvider>
                    <MultiStepFormContent
                        apiBaseUrl={apiBaseUrl}
                        providers={providers}
                        onClose={() => window.history.back()}
                        onSuccess={() => window.location.href = '/aggregator/applications'}
                        guestCompanyId={guestCompanyId}
                        aggregatorProfileId={aggregatorProfileId}
                        guestIsOmsEnabled={guestIsOmsEnabled}
                    />
                </FormProvider>
            </div>
        </div>
    );
}

