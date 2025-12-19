import MultiStepFormPage from '@/components/dashboard/aggregator/multi-step-application-form/MultiStepFormPage';

export default function NewApplicationPage() {
    return (
        <MultiStepFormPage
            apiBaseUrl={process.env.NEXT_PUBLIC_WEB_URL || ''}
            providers={[
                'ABFL',
                'Bajaj Finance',
                'Bajaj Market',
                'Cholamandalam',
                'Godrej',
                'L&T',
                'HDFC',
                'ICICI',
                'Indusind',
                'YES',
                'Axis',
                'Poonawala',
                'Tata',
            ]}
        />
    );
}
