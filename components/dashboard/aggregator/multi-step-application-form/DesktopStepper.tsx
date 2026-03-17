import React from 'react';
import { Check, Ban } from 'lucide-react';

export interface FormStepperProps {
    allSteps: { id: number; name: string; icon: string }[];
    showStep0: boolean;
    activeStep: number;
    completedSteps: number[];
    skippedSteps: number[];
}

export const DesktopStepper: React.FC<FormStepperProps> = ({
    allSteps,
    showStep0,
    activeStep,
    completedSteps,
    skippedSteps,
}) => {
    return (
        <div className="sticky top-16 space-y-6">
            {allSteps.map((step, idx) => {
                const isActive = showStep0 ? idx === 0 : idx === activeStep + 1;
                const isCompleted = showStep0
                    ? false
                    : idx === 0 || (idx > 0 && completedSteps.includes(idx - 1));
                const isSkipped = !showStep0 && idx > 0 && skippedSteps.includes(idx - 1);

                return (
                    <div key={step.id} className="relative">
                        {/* Vertical Line */}
                        {idx < allSteps.length - 1 && (
                            <div className="absolute left-7 top-14 w-0.5 h-24 bg-muted">
                                <div
                                    className={`h-full transition-all duration-500 ${isCompleted || isActive
                                        ? 'bg-gradient-to-b from-green-500 to-blue-500'
                                        : isSkipped
                                            ? 'bg-gradient-to-b from-yellow-500 to-orange-500'
                                            : 'bg-muted'
                                        }`}
                                    style={{
                                        height: isCompleted ? '100%' : isActive ? '50%' : isSkipped ? '100%' : '0%',
                                    }}
                                />
                            </div>
                        )}

                        {/* Step Item */}
                        <div className="flex items-start gap-4 mb-8">
                            <div
                                className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 z-10 ${isActive
                                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500 border-2 border-blue-400 shadow-lg shadow-blue-500/50 ring-4 ring-blue-500/20 scale-110'
                                    : isCompleted
                                        ? 'bg-gradient-to-br from-green-600 to-green-500 border-2 border-green-400'
                                        : isSkipped
                                            ? 'bg-gradient-to-br from-yellow-600 to-orange-500 border-2 border-yellow-400'
                                            : 'bg-card border-2 border-border'
                                    }`}
                            >
                                {isCompleted ? (
                                    <Check className="w-7 h-7 text-foreground" />
                                ) : isSkipped ? (
                                    <Ban className="w-6 h-6 text-foreground" />
                                ) : (
                                    <span className={`text-2xl ${isActive ? 'animate-pulse' : ''}`}>
                                        {step.icon}
                                    </span>
                                )}
                            </div>

                            <div className="pt-3 flex-1">
                                <p
                                    className={`text-base font-medium leading-tight transition-colors duration-300 ${isActive
                                        ? 'text-blue-400 font-semibold'
                                        : isCompleted
                                            ? 'text-green-400'
                                            : isSkipped
                                                ? 'text-yellow-400'
                                                : 'text-gray-500'
                                        }`}
                                >
                                    {step.name}
                                </p>
                                {isActive && (
                                    <p className="text-sm text-muted-foreground mt-1">In Progress</p>
                                )}
                                {isCompleted && (
                                    <p className="text-sm text-green-500 mt-1">Completed</p>
                                )}
                                {isSkipped && (
                                    <p className="text-sm text-yellow-500 mt-1">Skipped</p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
