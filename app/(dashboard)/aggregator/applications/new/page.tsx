import MultiStepFormPage from '@/components/dashboard/aggregator/multi-step-application-form/MultiStepFormPage';

export default function NewApplicationPage() {
    return (
        <MultiStepFormPage
            apiBaseUrl={process.env.NEXT_PUBLIC_WEB_URL || ''}
            providers={[
                'ABFL',
                'Bajaj Finance',
                'Bajaj Market',
                'L&T',
                'Tata',
                'Godrej',
                'Cholamandalam',
                'HDFC',
                'IDFC',
                'ICICI',
                'Incred',
                'Indusind',
                'Credit Saison',
                'Paysense',
                'Shriram',
                'HSBC Bank',
                'STANDARD Chartered Bank',
                'YES Bank',
                'Kotak Bank',
                'Poonawala',
                'Canara Bank',
                'Bank of Baroda',
                'PNB',
                'Axis',
                'Lending Kart',
            ]}
        />
    );
}
