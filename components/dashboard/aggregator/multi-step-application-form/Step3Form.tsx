'use client';

import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useFormContext } from './FormContext';
import { useToast } from '@/hooks/use-toast';

interface Step3FormProps {
  onSubmit: (files: {
    aadharFront: File | null;
    aadharBack: File | null;
    pancard: File | null;
    passportSizePhoto: File | null;
  }) => Promise<void>;
  isLoading: boolean;
  onSkip?: () => void;
}

interface FilePreview {
  file: File | null;
  preview: string;
}

export const Step3Form: React.FC<Step3FormProps> = ({ onSubmit, isLoading, onSkip }) => {
  const { nextStep, prevStep } = useFormContext();
  const { toast } = useToast();

  const [files, setFiles] = useState<{
    aadharFront: FilePreview;
    aadharBack: FilePreview;
    pancard: FilePreview;
    passportSizePhoto: FilePreview;
  }>({
    aadharFront: { file: null, preview: '' },
    aadharBack: { file: null, preview: '' },
    pancard: { file: null, preview: '' },
    passportSizePhoto: { file: null, preview: '' },
  });

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    field: keyof typeof files
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'File must be less than 10MB',
        variant: 'destructive',
      });
      return;
    }

    const preview = URL.createObjectURL(file);
    setFiles((prev) => ({
      ...prev,
      [field]: { file, preview },
    }));
  };

  const handleRemoveFile = (field: keyof typeof files) => {
    if (files[field].preview) {
      URL.revokeObjectURL(files[field].preview);
    }
    setFiles((prev) => ({
      ...prev,
      [field]: { file: null, preview: '' },
    }));
  };

  const handleUpload = async () => {
    if (!files.aadharFront.file) {
      toast({
        title: 'Missing Required Document',
        description: 'Aadhar Front is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('STEP 3 DOCUMENTS:', {
        aadharFront: files.aadharFront.file?.name,
        aadharBack: files.aadharBack.file?.name,
        pancard: files.pancard.file?.name,
        passportSizePhoto: files.passportSizePhoto.file?.name,
      });
      await onSubmit({
        aadharFront: files.aadharFront.file,
        aadharBack: files.aadharBack.file,
        pancard: files.pancard.file,
        passportSizePhoto: files.passportSizePhoto.file,
      });
      toast({
        title: 'Success',
        description: 'Documents uploaded successfully',
      });
      setTimeout(() => {
        nextStep();
      }, 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload documents',
        variant: 'destructive',
      });
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      nextStep();
    }
  };

  const FileUploadBox = ({
    label,
    field,
    required = false,
  }: {
    label: string;
    field: keyof typeof files;
    required?: boolean;
  }) => (
    <div className="space-y-2">
      <Label className="text-gray-300">
        {label}
        {required && <span className="text-red-400">*</span>}
      </Label>

      {!files[field].preview ? (
        <div
          className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gold transition-colors cursor-pointer"
          onClick={() => document.getElementById(field)?.click()}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-400">Click to upload</p>
          <input
            id={field}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={(e) => handleFileChange(e, field)}
            className="hidden"
          />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-gray-900/50 rounded-lg p-4"
        >
          {files[field].file?.type.startsWith('image/') ? (
            <img
              src={files[field].preview}
              alt={label}
              className="w-full h-40 object-cover rounded-lg"
            />
          ) : (
            <div className="flex items-center justify-center h-40">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
          <p className="text-sm text-gray-400 mt-2 truncate">
            {files[field].file?.name}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRemoveFile(field)}
            className="absolute top-2 right-2 text-red-400 hover:text-red-300 hover:bg-red-400/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">
          Profile Details and <span className="text-gold">Proof</span>
        </h2>
        <p className="text-gray-400">Step 3/4</p>
      </div>

      {/* Upload Forms */}
      <Card className="bg-gray-800/50 border-gray-700 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileUploadBox
            label="Aadhaar Card (Front)"
            field="aadharFront"
            required
          />

          <FileUploadBox
            label="Aadhaar Card (Back)"
            field="aadharBack"
          />

          <FileUploadBox
            label="PAN Card"
            field="pancard"
          />

          <FileUploadBox
            label="Passport Size Photo"
            field="passportSizePhoto"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Back
          </Button>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-gray-400 hover:text-white"
            >
              Skip
            </Button>

            <Button
              onClick={handleUpload}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue to-cyan-500 hover:to-blue-700 hover:to-cyan-600 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
};
