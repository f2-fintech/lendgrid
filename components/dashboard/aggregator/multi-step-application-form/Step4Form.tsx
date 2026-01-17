'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, X, FileText, Loader2, IndianRupee } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

import { step4Schema, Step4FormData } from './validation';
import { useFormContext } from './FormContext';
import { useToast } from '@/hooks/use-toast';

interface Step4FormProps {
  onSubmit: (data: Step4FormData, certificates: File[]) => Promise<void>;
  isLoading: boolean;
}

export const Step4Form: React.FC<Step4FormProps> = ({ onSubmit, isLoading }) => {
  const { prevStep, resetForm } = useFormContext();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<Step4FormData>({
    resolver: zodResolver(step4Schema),
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const totalFiles = certificates.length + files.length;

    if (totalFiles > 4) {
      toast({
        title: 'Too Many Files',
        description: 'Maximum 4 certificate files allowed',
        variant: 'destructive',
      });
      return;
    }

    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: `${file.name} exceeds 5MB limit`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    setCertificates((prev) => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setCertificates((prev) => prev.filter((_, i) => i !== index));
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const onFormSubmit = async (data: Step4FormData) => {
    try {
      console.log('STEP 4 FORM DATA:', data);

      console.log(
        'CERTIFICATES:',
        certificates.map((f) => ({
          name: f.name,
          size: f.size,
          type: f.type,
        }))
      );

      await onSubmit(data, certificates);
      toast({
        title: 'Success',
        description: 'Application submitted successfully',
      });
      setTimeout(() => {
        resetForm();
        // Reload or redirect as needed
        // window.location.reload();
      }, 800);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit application',
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
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold  text-foreground">
          Additional <span className="text-accent">Details</span>
        </h2>
        <p className=" text-muted-foreground">Step 4/4</p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <Card className="bg-card/50 border-border p-6 space-y-4">
          {/* Salary/Turnover */}
          <div>
            <Label htmlFor="salary" className=" text-foreground">
              Salary/Turnover (p.a)*
            </Label>
            <div className="relative mt-2">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4  text-muted-foreground" />
              <Input
                {...register('salary')}
                type="number"
                className="bg-card border-border  text-foreground pl-10"
                placeholder="Enter annual salary or turnover"
              />
            </div>
            {errors.salary && (
              <p className="text-red-400 text-sm mt-1">{errors.salary.message}</p>
            )}
          </div>

          {/* Existing EMI */}
          <div>
            <Label htmlFor="existing_emi" className=" text-foreground">
              Existing EMI Amount (Optional)
            </Label>
            <div className="relative mt-2">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4  text-muted-foreground" />
              <Input
                {...register('existing_emi')}
                type="number"
                className="bg-card border-border  text-foreground pl-10"
                placeholder="Enter existing EMI amount"
              />
            </div>
            {errors.existing_emi && (
              <p className="text-red-400 text-sm mt-1">
                {errors.existing_emi.message}
              </p>
            )}
          </div>

          {/* Existing Liability */}
          <div>
            <Label htmlFor="existing_liability" className=" text-foreground">
              Existing Credit Card Liability (Optional)
            </Label>
            <div className="relative mt-2">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4  text-muted-foreground" />
              <Input
                {...register('existing_liability')}
                type="number"
                className="bg-card border-border  text-foreground pl-10"
                placeholder="Enter credit card liability"
              />
            </div>
            {errors.existing_liability && (
              <p className="text-red-400 text-sm mt-1">
                {errors.existing_liability.message}
              </p>
            )}
          </div>
        </Card>

        {/* Certificate Upload */}
        <Card className="bg-card/50 border-border p-6">
          <Label className=" text-foreground mb-4 block">
            Degree and Registration Certificate (Optional)
          </Label>

          {/* Upload Button */}
          {certificates.length < 4 && (
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-gold transition-colors cursor-pointer mb-4"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="w-10 h-10 mx-auto mb-3  text-muted-foreground" />
              <p className=" text-foreground mb-1">Click to upload certificates</p>
              <p className="text-sm  text-muted-foreground">
                PDF, DOC, DOCX, JPG, PNG (Max 5MB per file, up to 4 files)
              </p>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* Selected Files List */}
          {certificates.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm  text-muted-foreground mb-2">
                Selected Files ({certificates.length}/4)
              </p>
              {certificates.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between bg-background/50 p-3 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className=" text-foreground text-sm">{file.name}</p>
                      <p className=" text-muted-foreground text-xs">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
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
              'Submit Application'
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};
