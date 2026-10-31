'use client';

import { FormProvider } from './FormContext';
import { MultiStepFormContent } from './MultiStepForm';

interface Props {
    apiBaseUrl: string;
    providers: string[];
    /** Guest/public mode props — forwarded from /apply/[companyId] page or sales partner application */
    guestCompanyId?: string;
    aggregatorProfileId?: string;
    guestIsOmsEnabled?: boolean;
    guestSource?: string;
    partnerName?: string;
    onSuccess?: () => void;
}

export default function MultiStepFormPage({
    apiBaseUrl,
    providers,
    guestCompanyId,
    aggregatorProfileId,
    guestIsOmsEnabled,
    guestSource,
    partnerName,
    onSuccess,
}: Props) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-6xl mx-auto p-6">
                {partnerName && (
                    <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-primary/10 to-transparent border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-base">
                                {partnerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-primary uppercase tracking-wider">
                                    Submitting for Channel Partner
                                </div>
                                <div className="text-base font-bold text-foreground">
                                    {partnerName}
                                    {guestCompanyId && (
                                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                                            (Company ID: {guestCompanyId})
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <span className="text-xs bg-primary/15 text-primary px-3 py-1 rounded-full font-medium">
                            Application will be bound to this partner
                        </span>
                    </div>
                )}
                <FormProvider>
                    <MultiStepFormContent
                        apiBaseUrl={apiBaseUrl}
                        providers={providers}
                        onClose={() => window.history.back()}
                        onSuccess={onSuccess || (() => window.location.href = '/aggregator/applications')}
                        guestCompanyId={guestCompanyId}
                        aggregatorProfileId={aggregatorProfileId}
                        guestIsOmsEnabled={guestIsOmsEnabled}
                        guestSource={guestSource}
                    />
                </FormProvider>
            </div>
        </div>
    );
}

