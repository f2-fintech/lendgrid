'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFormContext } from './FormContext';
import { useToast } from '@/hooks/use-toast';

interface Step2FormProps {
    onSubmit: (files: File[]) => Promise<void>;
    isLoading: boolean;
    onSkip?: () => void;
}

export const Step2Form: React.FC<Step2FormProps> = ({ onSubmit, isLoading, onSkip }) => {
    const { nextStep } = useFormContext();
    const { toast } = useToast();
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        const totalFiles = selectedFiles.length + files.length;

        if (totalFiles > 10) {
            toast({
                title: 'Too Many Files',
                description: 'Maximum 10 files allowed',
                variant: 'destructive',
            });
            return;
        }

        const validFiles = files.filter((file) => {
            if (file.size > 10 * 1024 * 1024) {
                toast({
                    title: 'File Too Large',
                    description: `${file.name} exceeds 10MB limit`,
                    variant: 'destructive',
                });
                return false;
            }
            return true;
        });

        setSelectedFiles((prev) => [...prev, ...validFiles]);
    };

    const handleRemoveFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const handleUpload = async () => {
        try {
            console.log(
                'STEP 2 FILES:',
                selectedFiles.map((f) => ({
                    name: f.name,
                    size: f.size,
                    type: f.type,
                }))
            );
            await onSubmit(selectedFiles);
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl mx-auto space-y-6"
        >
            {/* Header */}
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-white">
                    Statement <span className="text-gold">Upload</span>
                </h2>
                <p className="text-gray-400">Step 2/4</p>
                <p className="text-sm text-gray-400">
                    Upload your recent 6 months Bank Statement
                    <br />
                    Maximum File Upload Limit is <span className="text-gold">10</span>
                </p>
            </div>

            {/* Upload Area */}
            <Card className="bg-gray-800/50 border-gray-700 p-8">
                <div className="space-y-6">
                    {/* Drop Zone */}
                    {selectedFiles.length < 10 && (
                        <div
                            className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center hover:border-gold transition-colors cursor-pointer"
                            onClick={() => inputRef.current?.click()}
                        >
                            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-300 mb-2">
                                Click to upload or drag and drop
                            </p>
                            <p className="text-sm text-gray-400">
                                PDF, DOC, DOCX, JPG, PNG (Max 10MB per file)
                            </p>
                            <input
                                ref={inputRef}
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                    )}

                    {/* Selected Files List */}
                    {selectedFiles.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm text-gray-400">
                                Selected Files ({selectedFiles.length}/10)
                            </p>
                            {selectedFiles.map((file, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center justify-evenly bg-gray-900/50 p-3 rounded-lg"
                                >
                                    <div className="flex items-center space-x-3">
                                        <FileText className="w-5 h-5 text-blue-400" />
                                        <div>
                                            <p className="text-white text-sm">{file.name}</p>
                                            <p className="text-gray-400 text-xs">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                    <Button
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

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-4">
                        <Button
                            variant="ghost"
                            onClick={handleSkip}
                            disabled={selectedFiles.length > 0}
                            className="text-gray-400 hover:text-white"
                        >
                            Skip
                        </Button>

                        <Button
                            onClick={handleUpload}
                            disabled={selectedFiles.length === 0 || isLoading}
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
    );
};
