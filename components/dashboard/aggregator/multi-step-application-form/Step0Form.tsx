import React, { useState, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    IndianRupee,
    Clock,
    Building2,
    Edit,
    ArrowRight,
    AlertCircle,
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
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

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
    { value: 'null', label: 'Null' },
    { value: 'notion', label: 'Notion' },
    { value: 'dialler', label: 'Dialler' },
    { value: 'field visit', label: 'Field Visit' },
    { value: 'sourcer', label: 'Sourcer' },
    { value: 'channel partner', label: 'Channel Partner' },
    { value: 'ref from customer', label: 'Ref from Customer' },
    { value: 'left employee follow up', label: 'Left Employee Follow Up' },
];

export const Step0Form: React.FC<Step0FormProps> = ({ providers, onSubmit }) => {
    const [amountDialogOpen, setAmountDialogOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<string | null>(null);

    const { formData, setFormData, nextStep } = useFormContext();
    const { toast } = useToast();

    // React Hook Form setup with Zod validation
    const {
        control,
        handleSubmit: handleFormSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<Step0FormData>({
        resolver: zodResolver(step0Schema),
        defaultValues: {
            amount: formData.amount || '',
            loanType: formData.loanType || '',
            loanCategory: formData.loanCategory || '',
            tenure: formData.tenure || '',
            leadType: formData.leadType || 'null',
            providers: formData.providers || [],
            providerAmounts: formData.providerAmounts || [],
            hasRunningLoans: formData.hasRunningLoans || '',
            whichLoan: formData.whichLoan || '',
            runningLoanAmount: formData.runningLoanAmount || '',
            caseType: formData.caseType || '',
        },
    });

    // Watch form values for reactive updates
    const amount = watch('amount');
    const loanType = watch('loanType');
    const loanCategory = watch('loanCategory');
    const tenure = watch('tenure');
    const leadType = watch('leadType');
    const selectedProviders = watch('providers');
    const providerAmounts = watch('providerAmounts');
    const hasRunningLoans = watch('hasRunningLoans');
    const whichLoan = watch('whichLoan');
    const runningLoanAmount = watch('runningLoanAmount');
    const caseType = watch('caseType');

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
        setValue('loanType', value);
        const category = getLoanCategory(value);
        setValue('loanCategory', category);
        setValue('tenure', ''); // Reset tenure when loan type changes
    };

    // Handle provider selection
    const handleProviderToggle = (provider: string) => {
        const newProviders = selectedProviders.includes(provider)
            ? selectedProviders.filter((p) => p !== provider)
            : [...selectedProviders, provider];

        setValue('providers', newProviders);

        // Initialize amount for newly selected provider
        if (!selectedProviders.includes(provider)) {
            setValue('providerAmounts', [
                ...providerAmounts,
                { provider, amount: amount || '' },
            ]);
        } else {
            // Remove amount for deselected provider
            setValue('providerAmounts', providerAmounts.filter((pa) => pa.provider !== provider));
        }
    };

    // Update provider amount
    const updateProviderAmount = (provider: string, newAmount: string) => {
        setValue('providerAmounts',
            providerAmounts.map((pa) => (pa.provider === provider ? { ...pa, amount: newAmount } : pa))
        );
    };

    // Handle form submission with React Hook Form
    const onFormSubmit = (data: Step0FormData) => {
        setFormData(data);
        onSubmit();
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

            <form onSubmit={handleFormSubmit(onFormSubmit)} className="space-y-4">
                {/* Loan Amount */}
                <div>
                    <Label className="text-foreground">Loan Amount*</Label>
                    <div className="relative mt-2">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            type="text"
                            value={amount}
                            onChange={(e) => setValue('amount', e.target.value)}
                            className="bg-background border-border text-foreground pl-10 focus:ring-2 focus:ring-primary/20"
                            placeholder="Enter amount"
                        />
                    </div>
                    {errors.amount && (
                        <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.amount.message}
                        </p>
                    )}
                </div>

                {/* Loan Type */}
                <div>
                    <Label className="text-foreground">Loan Type*</Label>
                    <Controller
                        control={control}
                        name="loanType"
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={(value) => {
                                field.onChange(value);
                                handleLoanTypeChange(value);
                            }}>
                                <SelectTrigger className="bg-background border-border text-foreground mt-2">
                                    <div className="flex items-center">
                                        <Building2 className="w-4 h-4 mr-2" />
                                        <SelectValue placeholder="Choose loan type" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground">
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
                        )}
                    />
                    {errors.loanType && (
                        <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.loanType.message}
                        </p>
                    )}
                </div>

                {/* Tenure */}
                <div>
                    <Label className="text-foreground">Loan Tenure*</Label>
                    <Controller
                        control={control}
                        name="tenure"
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange} disabled={!loanCategory}>
                                <SelectTrigger className="bg-background border-border text-foreground mt-2">
                                    <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-2" />
                                        <SelectValue
                                            placeholder={
                                                loanCategory ? 'Choose tenure' : 'Select loan type first'
                                            }
                                        />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground">
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
                        )}
                    />
                    {errors.tenure && (
                        <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.tenure.message}
                        </p>
                    )}
                </div>

                {/* Lead Type (Optional) */}
                <div>
                    <Label className="text-foreground">Lead Type (Optional)</Label>
                    <Controller
                        control={control}
                        name="leadType"
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger className="bg-background border-border text-foreground mt-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                    {leadTypeOptions.map((leadType) => (
                                        <SelectItem
                                            key={leadType.label}
                                            value={leadType.value}
                                            className="text-foreground focus:bg-muted hover:bg-muted cursor-pointer"
                                        >
                                            {leadType.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>

                {/* Running Customer Loans */}
                <div>
                    <Label className="text-foreground">Running Customer Loans*</Label>
                    <Controller
                        control={control}
                        name="hasRunningLoans"
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={(value) => {
                                field.onChange(value);
                                // Clear conditional fields when switching to "no"
                                if (value === 'no') {
                                    setValue('whichLoan', '');
                                    setValue('runningLoanAmount', '');
                                }
                            }}>
                                <SelectTrigger className="bg-background border-border text-foreground mt-2">
                                    <div className="flex items-center">
                                        <Building2 className="w-4 h-4 mr-2" />
                                        <SelectValue placeholder="Select option" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                    <SelectItem
                                        value="yes"
                                        className="text-foreground focus:bg-muted hover:bg-muted cursor-pointer"
                                    >
                                        Yes
                                    </SelectItem>
                                    <SelectItem
                                        value="no"
                                        className="text-foreground focus:bg-muted hover:bg-muted cursor-pointer"
                                    >
                                        No
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.hasRunningLoans && (
                        <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.hasRunningLoans.message}
                        </p>
                    )}
                </div>

                {/* Conditional Fields - Which Loan and Loan Amount */}
                {hasRunningLoans === 'yes' && (
                    <>
                        {/* Which Loan Field */}
                        <div>
                            <Label className="text-foreground">Which Loan*</Label>
                            <Controller
                                control={control}
                                name="whichLoan"
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="bg-background border-border text-foreground mt-2">
                                            <div className="flex items-center">
                                                <Building2 className="w-4 h-4 mr-2" />
                                                <SelectValue placeholder="Choose loan type" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-popover-foreground">
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
                                )}
                            />
                            {errors.whichLoan && (
                                <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.whichLoan.message}
                                </p>
                            )}
                        </div>
                        {/* Running Loan Amount Field */}
                        <div>
                            <Label className="text-foreground">Running Loan Amount*</Label>
                            <div className="relative mt-2">
                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    value={runningLoanAmount}
                                    onChange={(e) => setValue('runningLoanAmount', e.target.value)}
                                    className="bg-background border-border text-foreground pl-10 focus:ring-2 focus:ring-primary/20"
                                    placeholder="Enter running loan amount"
                                />
                            </div>
                            {errors.runningLoanAmount && (
                                <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.runningLoanAmount.message}
                                </p>
                            )}
                        </div>
                    </>
                )}

                {/* Case Type */}
                <div>
                    <Label className="text-foreground">Case Type*</Label>
                    <Controller
                        control={control}
                        name="caseType"
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger className="bg-background border-border text-foreground mt-2">
                                    <div className="flex items-center">
                                        <Building2 className="w-4 h-4 mr-2" />
                                        <SelectValue placeholder="Select case type" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                    <SelectItem
                                        value="top_up"
                                        className="text-foreground focus:bg-muted hover:bg-muted cursor-pointer"
                                    >
                                        Top Up
                                    </SelectItem>
                                    <SelectItem
                                        value="fresh"
                                        className="text-foreground focus:bg-muted hover:bg-muted cursor-pointer"
                                    >
                                        Fresh
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.caseType && (
                        <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.caseType.message}
                        </p>
                    )}
                </div>

                {/* Providers Multi-Select Combobox */}
                <div>
                    <Label className="text-foreground">Select Providers* (Multiple)</Label>
                    <div className="mt-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between bg-background border-border text-foreground hover:bg-muted"
                                >
                                    {selectedProviders.length > 0
                                        ? `${selectedProviders.length} selected`
                                        : "Select providers..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0 bg-popover border-border" align="start">
                                <Command className="bg-popover text-popover-foreground">
                                    <CommandInput placeholder="Search provider..." className="h-9" />
                                    <CommandEmpty>No provider found.</CommandEmpty>
                                    <CommandGroup className="max-h-64 overflow-y-auto">
                                        {providers.map((provider) => (
                                            <CommandItem
                                                key={provider}
                                                value={provider}
                                                onSelect={() => handleProviderToggle(provider)}
                                                className="cursor-pointer aria-selected:bg-muted aria-selected:text-foreground"
                                            >
                                                <div
                                                    className={cn(
                                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                        selectedProviders.includes(provider)
                                                            ? "bg-primary text-primary-foreground"
                                                            : "opacity-50 [&_svg]:invisible"
                                                    )}
                                                >
                                                    <Check className={cn("h-4 w-4")} />
                                                </div>
                                                {provider}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Selected Tags */}
                    {selectedProviders.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {selectedProviders.map((provider) => (
                                <Badge
                                    key={provider}
                                    variant="secondary"
                                    className="px-3 py-1 text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center gap-1"
                                >
                                    {provider}
                                    <X
                                        className="h-3 w-3 cursor-pointer hover:text-red-500 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleProviderToggle(provider);
                                        }}
                                    />
                                </Badge>
                            ))}
                        </div>
                    )}

                    {errors.providers && (
                        <p className="text-red-400 text-sm mt-1">{errors.providers.message}</p>
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
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Let's Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </form>

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
