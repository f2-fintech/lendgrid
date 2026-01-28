import React, { useState, useEffect } from 'react';
import {
    IndianRupee,
    Clock,
    Building2,
    Edit,
    ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { step0Schema, Step0FormData } from './validation';
import { useFormContext } from './FormContext';
import { useToast } from '@/hooks/use-toast';

interface Step0FormProps {
    providers: string[];
    onSubmit: () => void;
}

const loanTypes = {
    secured: [
        { value: 'home loan', label: 'Home Loan' },
        { value: 'lap', label: 'LAP (Loan Against Property)' },
        { value: 'auto loan', label: 'Auto Loan' },
        { value: 'machinery loan', label: 'Machinery Loan' },
    ],
    unsecured: [
        { value: 'personal loan', label: 'Personal Loan' },
        { value: 'business loan', label: 'Business Loan' },
        { value: 'professional loan', label: 'Professional Loan' },
        { value: 'education loan', label: 'Education Loan' },
        { value: 'just inquiry', label: 'Just Inquiry' },
    ],
};

const tenureOptions = {
    secured: ['5 Years', '8 Years', '10 Years', '15 Years', '20 Years', '25 Years', '30 Years'],
    unsecured: ['1 Year', '2 Years', '3 Years', '4 Years', '5 Years', '6 Years', '7 Years', '8 Years'],
};

const leadTypeOptions = [
    'null',
    'notion',
    'dialler',
    'field visit',
    'sourcer',
    'channel partner',
    'ref from customer',
    'left employee follow up',
];

export const Step0Form: React.FC<Step0FormProps> = ({ providers, onSubmit }) => {
    const { formData, setFormData, nextStep } = useFormContext();
    const { toast } = useToast();

    const [amount, setAmount] = useState(formData.amount || '');
    const [loanType, setLoanType] = useState(formData.loanType || '');
    const [loanCategory, setLoanCategory] = useState(formData.loanCategory || '');
    const [tenure, setTenure] = useState(formData.tenure || '');
    const [leadType, setLeadType] = useState(formData.leadType || 'null');
    const [selectedProviders, setSelectedProviders] = useState<string[]>(
        formData.providers || []
    );
    const [providerAmounts, setProviderAmounts] = useState<
        { provider: string; amount: string }[]
    >(formData.providerAmounts || []);
    const [amountDialogOpen, setAmountDialogOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<string | null>(null);
    const [errors, setErrors] = useState({
        amount: '',
        loanType: '',
        tenure: '',
        providers: '',
    });

    // Determine loan category based on loan type
    const getLoanCategory = (type: string): string => {
        const securedTypes = ['home loan', 'lap', 'auto loan', 'machinery loan'];
        const unsecuredTypes = [
            'personal loan',
            'business loan',
            'professional loan',
            'education loan',
            'just inquiry',
        ];

        if (securedTypes.includes(type)) return 'secured';
        if (unsecuredTypes.includes(type)) return 'unsecured';
        return '';
    };

    // Handle loan type change
    const handleLoanTypeChange = (value: string) => {
        setLoanType(value);
        const category = getLoanCategory(value);
        setLoanCategory(category);
        setTenure(''); // Reset tenure when loan type changes
        validateLoanType(value);
    };

    // Validation functions
    const validateAmount = (value: string) => {
        let error = '';
        if (!value) {
            error = 'Amount is required';
        } else if (isNaN(Number(value))) {
            error = 'Amount must be a number';
        } else if (Number(value) < 50000 || Number(value) > 100000000) {
            error = 'Amount must be between 50,000 and 10,00,00,000';
        } else if (Number(value) % 5 !== 0) {
            error = 'Amount must be divisible by 5';
        }
        setErrors((prev) => ({ ...prev, amount: error }));
        return !error;
    };

    const validateLoanType = (value: string) => {
        const error = !value ? 'Loan type is required' : '';
        setErrors((prev) => ({ ...prev, loanType: error }));
        return !error;
    };

    const validateTenure = (value: string) => {
        const error = !value ? 'Tenure is required' : '';
        setErrors((prev) => ({ ...prev, tenure: error }));
        return !error;
    };

    const validateProviders = (values: string[]) => {
        const error = values.length === 0 ? 'At least one provider must be selected' : '';
        setErrors((prev) => ({ ...prev, providers: error }));
        return !error;
    };

    // Handle provider selection
    const handleProviderToggle = (provider: string) => {
        const newProviders = selectedProviders.includes(provider)
            ? selectedProviders.filter((p) => p !== provider)
            : [...selectedProviders, provider];

        setSelectedProviders(newProviders);
        validateProviders(newProviders);

        // Initialize amount for newly selected provider
        if (!selectedProviders.includes(provider)) {
            setProviderAmounts((prev) => [
                ...prev,
                { provider, amount: amount || '' },
            ]);
        } else {
            // Remove amount for deselected provider
            setProviderAmounts((prev) => prev.filter((pa) => pa.provider !== provider));
        }
    };

    // Update provider amount
    const updateProviderAmount = (provider: string, newAmount: string) => {
        setProviderAmounts((prev) =>
            prev.map((pa) => (pa.provider === provider ? { ...pa, amount: newAmount } : pa))
        );
    };

    // Validate all provider amounts
    const validateAllProviderAmounts = () => {
        for (const pa of providerAmounts) {
            if (!pa.amount) return false;
            if (isNaN(Number(pa.amount))) return false;
            if (Number(pa.amount) < 50000 || Number(pa.amount) > 100000000) return false;
            if (Number(pa.amount) % 5 !== 0) return false;
        }
        return true;
    };

    // Handle form submission
    const handleSubmit = () => {
        const isAmountValid = validateAmount(amount);
        const isLoanTypeValid = validateLoanType(loanType);
        const isTenureValid = validateTenure(tenure);
        const areProvidersValid = validateProviders(selectedProviders);
        const areAmountsValid = validateAllProviderAmounts();

        if (
            isAmountValid &&
            isLoanTypeValid &&
            isTenureValid &&
            areProvidersValid &&
            areAmountsValid
        ) {
            setFormData({
                amount,
                loanType,
                loanCategory,
                leadType,
                tenure,
                providers: selectedProviders,
                providerAmounts,
            });
            onSubmit();
        } else {
            toast({
                title: 'Validation Error',
                description: 'Please fill all required fields correctly',
                variant: 'destructive',
            });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl mx-auto space-y-6"
        >
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-foreground">
                    Enter the details to get started
                </h2>
            </div>

            <div className="space-y-4">
                {/* Loan Amount */}
                <div>
                    <Label className="text-foreground">Loan Amount*</Label>
                    <div className="relative mt-2">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            type="number"
                            value={amount}
                            onChange={(e) => {
                                setAmount(e.target.value);
                                validateAmount(e.target.value);
                            }}
                            onBlur={() => validateAmount(amount)}
                            className="bg-card border-border text-foreground pl-10"
                            placeholder="Base loan amount (can customize per provider)"
                        />
                    </div>
                    {errors.amount && (
                        <p className="text-red-400 text-sm mt-1">{errors.amount}</p>
                    )}
                </div>

                {/* Loan Type */}
                <div>
                    <Label className="text-foreground">Loan Type*</Label>
                    <Select value={loanType} onValueChange={handleLoanTypeChange}>
                        <SelectTrigger className="bg-card border-border text-foreground mt-2">
                            <div className="flex items-center">
                                <Building2 className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Choose loan type" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border">
                            <div className="px-2 py-1 text-xs font-semibold text-primary select-none">
                                Secured Loans
                            </div>
                            {loanTypes.secured.map((loan) => (
                                <SelectItem
                                    key={loan.value}
                                    value={loan.value}
                                    className="text-foreground focus:bg-muted hover:bg-muted cursor-pointer"
                                >
                                    {loan.label}
                                </SelectItem>
                            ))}
                            <div className="px-2 py-1 text-xs font-semibold text-primary mt-2 select-none">
                                Unsecured Loans
                            </div>
                            {loanTypes.unsecured.map((loan) => (
                                <SelectItem
                                    key={loan.value}
                                    value={loan.value}
                                    className="text-foreground focus:bg-muted hover:bg-muted cursor-pointer"
                                >
                                    {loan.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.loanType && (
                        <p className="text-red-400 text-sm mt-1">{errors.loanType}</p>
                    )}
                </div>

                {/* Tenure */}
                <div>
                    <Label className="text-foreground">
                        {loanCategory
                            ? `Tenure (${loanCategory === 'secured' ? 'Long Term' : 'Short Term'})*`
                            : 'Select Tenure*'}
                    </Label>
                    <Select
                        value={tenure}
                        onValueChange={(value) => {
                            setTenure(value);
                            validateTenure(value);
                        }}
                        disabled={!loanCategory}
                    >
                        <SelectTrigger className="bg-card border-border text-foreground mt-2">
                            <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-2" />
                                <SelectValue
                                    placeholder={
                                        loanCategory ? 'Choose tenure' : 'Select loan type first'
                                    }
                                />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border">
                            {(loanCategory ? tenureOptions[loanCategory] : []).map((option) => (
                                <SelectItem
                                    key={option}
                                    value={option}
                                    className="text-foreground focus:bg-muted hover:bg-muted cursor-pointer"
                                >
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.tenure && (
                        <p className="text-red-400 text-sm mt-1">{errors.tenure}</p>
                    )}
                </div>

                {/* Lead Type (Optional) */}
                <div>
                    <Label className="text-foreground">Lead Type (Optional)</Label>
                    <Select
                        value={leadType}
                        onValueChange={(value) => setLeadType(value)}
                    >
                        <SelectTrigger className="bg-card border-border text-foreground mt-2">
                            <SelectValue />
                        </SelectTrigger>

                        <SelectContent className="bg-background border-border">
                            {leadTypeOptions.map((type) => (
                                <SelectItem
                                    key={type}
                                    value={type}
                                    className="text-foreground focus:bg-muted hover:bg-muted cursor-pointer"
                                >
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Providers */}
                <div>
                    <Label className="text-foreground">Select Providers* (Multiple)</Label>
                    <div className="mt-2 bg-card border border-border rounded-lg p-4 space-y-2">
                        {providers.map((provider) => (
                            <div key={provider} className="flex items-center space-x-2">
                                <Checkbox
                                    checked={selectedProviders.includes(provider)}
                                    onCheckedChange={() => handleProviderToggle(provider)}
                                />
                                <Label className="text-foreground flex-1">{provider}</Label>
                            </div>
                        ))}
                    </div>
                    {errors.providers && (
                        <p className="text-red-400 text-sm mt-1">{errors.providers}</p>
                    )}
                </div>

                {/* Provider Amounts */}
                {selectedProviders.length > 0 && (
                    <div className="bg-card/50 border border-border rounded-lg p-4">
                        <Label className="text-foreground mb-3 block">
                            Customize Amounts per Provider
                        </Label>
                        <div className="space-y-2">
                            {selectedProviders.map((provider) => {
                                const providerAmount =
                                    providerAmounts.find((pa) => pa.provider === provider)?.amount ||
                                    amount;
                                return (
                                    <div
                                        key={provider}
                                        className="flex items-center justify-between bg-background/50 p-3 rounded-lg"
                                    >
                                        <span className="text-foreground text-sm">{provider}</span>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-primary">
                                                ₹{providerAmount || 'Not set'}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setEditingProvider(provider);
                                                    setAmountDialogOpen(true);
                                                }}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <Button
                    onClick={handleSubmit}
                    disabled={
                        !amount ||
                        !loanType ||
                        !tenure ||
                        selectedProviders.length === 0 ||
                        !validateAllProviderAmounts()
                    }
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Let's Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>

            {/* Amount Edit Dialog */}
            <Dialog open={amountDialogOpen} onOpenChange={setAmountDialogOpen}>
                <DialogContent className="bg-background border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">
                            Set Amount for {editingProvider}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="number"
                                value={
                                    providerAmounts.find((pa) => pa.provider === editingProvider)
                                        ?.amount || amount
                                }
                                onChange={(e) => {
                                    if (editingProvider) {
                                        updateProviderAmount(editingProvider, e.target.value);
                                    }
                                }}
                                className="bg-card border-border text-foreground pl-10"
                                placeholder="Enter amount"
                            />
                        </div>
                        <p className="text-muted-foreground text-sm">
                            Amount must be between 50,000 and 10,00,00,000 and divisible by 5
                        </p>
                        <Button
                            onClick={() => setAmountDialogOpen(false)}
                            className="w-full bg-primary hover:bg-primary/90"
                        >
                            Done
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
};
