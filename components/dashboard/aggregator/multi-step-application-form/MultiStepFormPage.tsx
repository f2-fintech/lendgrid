'use client';

import { FormProvider } from './FormContext';
import { MultiStepFormContent } from './MultiStepForm';

interface Props {
    apiBaseUrl: string;
    providers: string[];
}

export default function MultiStepFormPage({ apiBaseUrl, providers }: Props) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
            <div className="max-w-6xl mx-auto p-6">
                <FormProvider>
                    <MultiStepFormContent
                        apiBaseUrl={apiBaseUrl}
                        providers={providers}
                        onClose={() => window.history.back()}
                        onSuccess={() => window.location.href = '/aggregator/applications'}
                    />
                </FormProvider>
            </div>
        </div>
    );
}
