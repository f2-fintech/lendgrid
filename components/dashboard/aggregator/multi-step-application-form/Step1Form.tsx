'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
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
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

import { step1Schema, Step1FormData } from './validation';
import { useFormContext } from './FormContext';
import { useToast } from '@/hooks/use-toast';

interface Step1FormProps {
  onSubmit: (data: Step1FormData, customerId: string) => Promise<void>;
  isLoading: boolean;
  onBack: () => void;
}

export const Step1Form: React.FC<Step1FormProps> = ({ onSubmit, isLoading, onBack }) => {
  const { nextStep } = useFormContext();
  const { toast } = useToast();
  const [date, setDate] = useState<Date>();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
  } = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
  });

  const title = watch('title');
  const employmentType = watch('employment_type');

  const onFormSubmit = async (data: Step1FormData) => {
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
                <SelectItem value="Mr" className="focus:bg-accent focus:text-accent-foreground" >Mr</SelectItem>
                <SelectItem value="Mrs" className="focus:bg-accent focus:text-accent-foreground">Mrs</SelectItem>
                <SelectItem value="Miss" className="focus:bg-accent focus:text-accent-foreground">Miss</SelectItem>
                <SelectItem value="Dr" className="focus:bg-accent focus:text-accent-foreground">Dr</SelectItem>
                <SelectItem value="Ca" className="focus:bg-accent focus:text-accent-foreground">Ca</SelectItem>
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
          <Input
            {...register('pan')}
            className="bg-card border-border  text-foreground mt-2 uppercase"
            placeholder="Enter PAN card number"
            maxLength={10}
            onChange={(e) => {
              const upperValue = e.target.value.toUpperCase();
              setValue('pan', upperValue, { shouldValidate: true });
            }}
          />
          {errors.pan && (
            <p className="text-red-400 text-sm mt-1">{errors.pan.message}</p>
          )}
        </div>

        {/* Father's and Mother's Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="father_name" className=" text-foreground">Father's Name*</Label>
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
            <Label htmlFor="state" className=" text-foreground">State*</Label>
            <Input
              {...register('state')}
              className="bg-card border-border  text-foreground mt-2"
              placeholder="Enter state"
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
                className="focus:bg-accent focus:text-accent-foreground"
              >
                Salaried
              </SelectItem>
              <SelectItem
                value="business"
                className="focus:bg-accent focus:text-accent-foreground"
              >
                Business
              </SelectItem>
              <SelectItem
                value="professional"
                className="focus:bg-accent focus:text-accent-foreground"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {/* Manual Input */}
              <Input
                type="date"
                className="bg-card border-border  text-foreground"
                max={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    const parsedDate = new Date(value);
                    setDate(parsedDate);
                    setValue('dob', parsedDate, { shouldValidate: true });
                  }
                }}
              />

              {/* Calendar Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-card border-border  text-foreground justify-start"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : 'Pick from calendar'}
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0 bg-popover border-border">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => {
                      if (selectedDate) {
                        setDate(selectedDate);
                        setValue('dob', selectedDate, { shouldValidate: true });
                      }
                    }}
                    captionLayout="dropdown-buttons"
                    fromYear={1950}
                    toYear={new Date().getFullYear() - 20}
                    disabled={(date) =>
                      date > new Date() || date < new Date('1950-01-01')
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
              You must be at least 20 years old
            </p>
          </div>
          {errors.dob && (
            <p className="text-red-400 text-sm mt-1">{errors.dob.message}</p>
          )}
          <p className=" text-muted-foreground text-xs mt-1">Minimum age 20 required</p>
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
            disabled={!isDirty || isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Apply Now'
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};
