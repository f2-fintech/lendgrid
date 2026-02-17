import MultiStepFormPage from '@/components/dashboard/aggregator/multi-step-application-form/MultiStepFormPage';

export default function NewApplicationPage() {
    return (
        <MultiStepFormPage
            apiBaseUrl={process.env.NEXT_PUBLIC_WEB_URL || ''}
            providers={[
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
