'use client';

import React, { useState, useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Loader2, Clock, RotateCcw } from 'lucide-react';
import { format, subYears } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';
import { getCompanyId } from '@/lib/http-client';
import { getCookie } from '@/lib/utils';

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
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { step1Schema, Step1FormData, indianStates } from './validation';
import { useFormContext } from './FormContext';
import { useToast } from '@/hooks/use-toast';

interface Step1FormProps {
  onSubmit: (data: Step1FormData, customerId: string) => Promise<void>;
  isLoading: boolean;
  onBack: () => void;
  /** Base URL of the API (f2fintech-server or lendgrid-server proxy) */
  apiBaseUrl: string;
  /** Clears localStorage + resets form context, navigates back to Step-0 */
  onReset: () => void;
}

// Shape of the enriched duplicate info returned by the API
interface DuplicateInfo {
  message: string;
  daysRemaining: number;
  application: {
    id: number;
    application_no: number;
    loan_type: string;
    loan_category: string;
    provider: string;
    application_date: string;
    is_picked: number;
  };
  ticket: {
    id: number;
    status: string;
    created_at: string;
  } | null;
}

export const Step1Form: React.FC<Step1FormProps> = ({ onSubmit, isLoading, onBack, apiBaseUrl, onReset }) => {
  const { nextStep } = useFormContext();
  const { toast } = useToast();
  const [date, setDate] = useState<Date>();

  // ── Duplicate-check state ─────────────────────────────────────────────────
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateInfo | null>(null);
  const [isDuplicateChecking, setIsDuplicateChecking] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    getValues,
  } = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
  });

  const title = watch('title');
  const employmentType = watch('employment_type');

  // ── Real-time duplicate check ─────────────────────────────────────────────
  // Called on blur of the PAN field (once both mobile and PAN look complete).
  const handlePanBlur = useCallback(async () => {
    const contact = getValues('contact');
    const pan = getValues('pan');

    // Only fire if both fields pass basic format checks
    const mobileOk = /^[0-9]{7,15}$/.test((contact || '').trim());
    const panOk = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test((pan || '').trim().toUpperCase());
    if (!mobileOk || !panOk) return;

    setDuplicateInfo(null);
    setIsDuplicateChecking(true);
    try {
      const token = getCookie('lendgrid_cookie');
      const companyId = typeof window !== 'undefined' ? getCompanyId() : null;
      const resolvedCompanyId = companyId && companyId !== 'all' ? String(companyId) : '';

      const response = await fetch(`${apiBaseUrl}/check-duplicate-application`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(resolvedCompanyId ? { 'companyid': resolvedCompanyId } : {}),
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ mobile: contact.trim(), pan: pan.trim().toUpperCase() }),
      });

      const result = await response.json();
      if (result?.data?.isDuplicate) {
        setDuplicateInfo({
          message: result.data.message,
          daysRemaining: result.data.daysRemaining,
          application: result.data.application,
          ticket: result.data.ticket ?? null,
        });
      }
    } catch (err) {
      // Network failure during check — silent fail, do not block the user
      console.warn('[duplicate-check] Network error, skipping check:', err);
    } finally {
      setIsDuplicateChecking(false);
    }
  }, [apiBaseUrl, getValues]);

  const onFormSubmit = async (data: Step1FormData) => {
    // Guard: block submit if a duplicate was detected
    if (duplicateInfo) return;
    try {
      console.log('STEP 1 FORM DATA:', data);
      await onSubmit(data, '');
      nextStep();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit form. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold  text-foreground">
          Basic <span className="text-accent">Details</span>
        </h2>
        <p className=" text-muted-foreground">Step 1/4</p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Title and Name */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <Label htmlFor="title" className=" text-foreground">Title*</Label>
            <Select
              value={title}
              onValueChange={(value) => setValue('title', value as any, { shouldValidate: true })}
            >
              <SelectTrigger className="bg-card border-border  text-foreground mt-2">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground">
                <SelectItem value="Mr" className="focus:bg-accent focus:text-accent-foreground cursor-pointer">Mr</SelectItem>
                <SelectItem value="Mrs" className="focus:bg-accent focus:text-accent-foreground cursor-pointer">Mrs</SelectItem>
                <SelectItem value="Miss" className="focus:bg-accent focus:text-accent-foreground cursor-pointer">Miss</SelectItem>
                <SelectItem value="Dr" className="focus:bg-accent focus:text-accent-foreground cursor-pointer">Dr</SelectItem>
                <SelectItem value="Ca" className="focus:bg-accent focus:text-accent-foreground cursor-pointer">Ca</SelectItem>
              </SelectContent>
            </Select>
            {errors.title && (
              <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div className="md:col-span-3">
            <Label htmlFor="name" className=" text-foreground">Full Name*</Label>
            <Input
              {...register('name')}
              className="bg-card border-border  text-foreground mt-2"
              placeholder="Enter full name"
            />
            {errors.name && (
              <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>
        </div>

        {/* Contact and Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contact" className=" text-foreground">Contact Number*</Label>
            <Input
              {...register('contact')}
              className="bg-card border-border  text-foreground mt-2"
              placeholder="Enter contact number"
              type="tel"
            />
            {errors.contact && (
              <p className="text-red-400 text-sm mt-1">{errors.contact.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email" className=" text-foreground">Email*</Label>
            <Input
              {...register('email')}
              className="bg-card border-border  text-foreground mt-2"
              placeholder="Enter email address"
              type="email"
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>
        </div>

        {/* PAN */}
        <div>
          <Label htmlFor="pan" className=" text-foreground">PAN Card*</Label>
          <div className="relative">
            <Input
              {...register('pan')}
              className="bg-card border-border text-foreground mt-2 uppercase pr-9"
              placeholder="Enter PAN card number"
              maxLength={10}
              onChange={(e) => {
                const upperValue = e.target.value.toUpperCase();
                setValue('pan', upperValue, { shouldValidate: true });
                // Clear any previous duplicate error when user edits PAN
                if (duplicateInfo) setDuplicateInfo(null);
              }}
              onBlur={handlePanBlur}
            />
            {isDuplicateChecking && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 mt-1">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </span>
            )}
          </div>
          {errors.pan && !duplicateInfo && (
            <p className="text-red-400 text-sm mt-1">{errors.pan.message}</p>
          )}
        </div>

        {/* Permanent inline duplicate-application error banner */}
        <AnimatePresence>
          {duplicateInfo && (
            <motion.div
              key="duplicate-banner"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="rounded-lg border border-red-500/40 bg-red-500/10 overflow-hidden"
              role="alert"
              aria-live="assertive"
            >
              {/* Banner header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-red-500/20">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-red-400 shrink-0" />
                  <span className="text-sm font-semibold text-red-400">Application Already Exists</span>
                </div>
                {/* Start Fresh button with tooltip */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onReset}
                      className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-red-300 border border-red-500/30 hover:bg-red-500/20 hover:text-red-200 transition-colors duration-150"
                      aria-label="Start fresh — clear all form data and return to start"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Create New Application
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Create New Application</TooltipContent>
                </Tooltip>
              </div>

              {/* Banner body — application details */}
              <div className="px-4 py-3 space-y-2.5">
                <p className="text-sm text-red-300 leading-snug">{duplicateInfo.message}</p>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  {/* Loan Type */}
                  <div>
                    <span className="text-muted-foreground">Loan Type</span>
                    <p className="text-foreground font-medium capitalize">{duplicateInfo.application.loan_type || '—'}</p>
                  </div>
                  {/* Loan Category */}
                  <div>
                    <span className="text-muted-foreground">Category</span>
                    <p className="text-foreground font-medium capitalize">{duplicateInfo.application.loan_category || '—'}</p>
                  </div>
                  {/* Provider */}
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Provider(s)</span>
                    <p className="text-foreground font-medium">{duplicateInfo.application.provider || '—'}</p>
                  </div>
                  {/* Applied On */}
                  <div>
                    <span className="text-muted-foreground">Applied On</span>
                    <p className="text-foreground font-medium">
                      {duplicateInfo.application.application_date
                        ? new Date(duplicateInfo.application.application_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </p>
                  </div>

                  {/* Conditional: App No (not picked) vs Ticket ID (picked) */}
                  {duplicateInfo.application.is_picked === 0 ? (
                    <div>
                      <span className="text-muted-foreground">Application No</span>
                      <p className="text-amber-400 font-semibold font-mono">
                        #{duplicateInfo.application.application_no}
                      </p>
                      <span className="text-[10px] text-muted-foreground">Search by this in admin panel</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-muted-foreground">Ticket ID</span>
                      <p className="text-amber-400 font-semibold font-mono">
                        {duplicateInfo.ticket ? `#${duplicateInfo.ticket.id}` : `App #${duplicateInfo.application.application_no}`}
                      </p>
                      <span className="text-[10px] text-muted-foreground">Search by this in admin panel</span>
                    </div>
                  )}
                </div>

                {/* Status chip (only when ticket exists) */}
                {duplicateInfo.ticket && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-muted-foreground">Status:</span>
                    <span className="inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-medium text-amber-400 capitalize">
                      {duplicateInfo.ticket.status}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Father's and Mother's Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="father_name" className=" text-foreground">Father's Name</Label>
            <Input
              {...register('father_name')}
              className="bg-card border-border  text-foreground mt-2"
              placeholder="Enter father's name"
            />
            {errors.father_name && (
              <p className="text-red-400 text-sm mt-1">{errors.father_name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="mother_name" className=" text-foreground">Mother's Name*</Label>
            <Input
              {...register('mother_name')}
              className="bg-card border-border  text-foreground mt-2"
              placeholder="Enter mother's name"
            />
            {errors.mother_name && (
              <p className="text-red-400 text-sm mt-1">{errors.mother_name.message}</p>
            )}
          </div>
        </div>

        {/* Addresses */}
        <div>
          <Label htmlFor="working_address" className=" text-foreground">Working Address*</Label>
          <Input
            {...register('working_address')}
            className="bg-card border-border  text-foreground mt-2"
            placeholder="Enter working address"
          />
          {errors.working_address && (
            <p className="text-red-400 text-sm mt-1">{errors.working_address.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="permanent_address" className=" text-foreground">Permanent Address*</Label>
          <Input
            {...register('permanent_address')}
            className="bg-card border-border  text-foreground mt-2"
            placeholder="Enter permanent address"
          />
          {errors.permanent_address && (
            <p className="text-red-400 text-sm mt-1">{errors.permanent_address.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="current_address" className=" text-foreground">Current Address*</Label>
          <Input
            {...register('current_address')}
            className="bg-card border-border  text-foreground mt-2"
            placeholder="Enter current address"
          />
          {errors.current_address && (
            <p className="text-red-400 text-sm mt-1">{errors.current_address.message}</p>
          )}
        </div>

        {/* City and State */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city" className=" text-foreground">City*</Label>
            <Input
              {...register('city')}
              className="bg-card border-border  text-foreground mt-2"
              placeholder="Enter city"
            />
            {errors.city && (
              <p className="text-red-400 text-sm mt-1">{errors.city.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="state" className="text-foreground">State*</Label>
            <Controller
              control={control}
              name="state"
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="bg-card border-border text-foreground mt-2">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground max-h-60">
                    {indianStates.map((state) => (
                      <SelectItem key={state} value={state} className="focus:bg-accent focus:text-accent-foreground cursor-pointer">
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.state && (
              <p className="text-red-400 text-sm mt-1">{errors.state.message}</p>
            )}
          </div>
        </div>

        {/* Employment Type */}
        <div>
          <Label htmlFor="employment_type" className=" text-foreground">Employment Type*</Label>
          <Select
            value={employmentType}
            onValueChange={(value) => setValue('employment_type', value as any, { shouldValidate: true })}
          >
            <SelectTrigger className="bg-card border-border  text-foreground mt-2">
              <SelectValue placeholder="Select employment type" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-popover-foreground">
              <SelectItem
                value="salaried"
                className="focus:bg-accent focus:text-accent-foreground cursor-pointer"
              >
                Salaried
              </SelectItem>
              <SelectItem
                value="business"
                className="focus:bg-accent focus:text-accent-foreground cursor-pointer"
              >
                Business
              </SelectItem>
              <SelectItem
                value="professional"
                className="focus:bg-accent focus:text-accent-foreground cursor-pointer"
              >
                Professional
              </SelectItem>
            </SelectContent>
          </Select>
          {errors.employment_type && (
            <p className="text-red-400 text-sm mt-1">{errors.employment_type.message}</p>
          )}
        </div>

        {/* Date of Birth */}
        <div>
          <div>
            <Label className=" text-foreground">Date of Birth*</Label>

            <div className="mt-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full bg-card border-border text-foreground justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : 'Pick from calendar'}
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => {
                      if (selectedDate) {
                        setDate(selectedDate);
                        setValue('dob', selectedDate, { shouldValidate: true });
                      }
                    }}
                    captionLayout="dropdown"
                    fromYear={1950}
                    toYear={new Date().getFullYear() - 20}
                    defaultMonth={subYears(new Date(), 20)}
                    disabled={(date) =>
                      date > subYears(new Date(), 20) || date < new Date('1950-01-01')
                    }
                    initialFocus
                    className="bg-popover text-popover-foreground"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {errors.dob && (
              <p className="text-red-400 text-sm mt-1">{errors.dob.message}</p>
            )}

            <p className=" text-muted-foreground text-xs mt-1">
              Minimum age 20 required
            </p>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="space-y-4 pt-4">
          <div className="flex items-start space-x-2">
            <Checkbox defaultChecked className="mt-1" />
            <Label className=" text-foreground text-sm leading-relaxed">
              I agree to opt for the product and service of F2fintech. By opting for F2fintech,
              I agree to have read, understood and explicitly consent to the T&C, Privacy Policy
              and F2fintech Credit Terms.
            </Label>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox defaultChecked className="mt-1" />
            <Label className=" text-foreground text-sm leading-relaxed">
              I further consent to receive the loan and product updates of F2fintech on WhatsApp
              and allow F2fintech and/or their authorized third party service providers to contact
              me for marketing purposes via SMS, Call, WhatsApp, and Email.
            </Label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-around items-center pt-4">
          <Button
            variant="outline"
            onClick={() => onBack()}
            className="border-border  text-foreground hover:bg-muted"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={!isDirty || isLoading || !!duplicateInfo || isDuplicateChecking}
            className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
            title={duplicateInfo ? 'Application already exists — cannot proceed' : undefined}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : isDuplicateChecking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              'Proceed To Next Step'
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};
