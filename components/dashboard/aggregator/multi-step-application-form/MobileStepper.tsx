import React, { useEffect, useRef } from 'react';
import { Check, Ban } from 'lucide-react';
import { FormStepperProps } from './DesktopStepper';

export const MobileStepper: React.FC<FormStepperProps> = ({
    allSteps,
    showStep0,
    activeStep,
    completedSteps,
    skippedSteps,
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Scroll active step into view
    useEffect(() => {
        if (!scrollContainerRef.current) return;
        
        const currentIdx = showStep0 ? 0 : activeStep + 1;
        const activeElement = scrollContainerRef.current.children[currentIdx] as HTMLElement;
        
        if (activeElement) {
            // Calculate position to center the active element
            const containerWidth = scrollContainerRef.current.offsetWidth;
            const elementOffset = activeElement.offsetLeft;
            const elementWidth = activeElement.offsetWidth;
            
            const scrollPosition = elementOffset - (containerWidth / 2) + (elementWidth / 2);
            
            scrollContainerRef.current.scrollTo({
                left: Math.max(0, scrollPosition),
                behavior: 'smooth'
            });
        }
    }, [activeStep, showStep0]);

    return (
        <div className="w-full pb-4 border-b border-border shadow-sm bg-background/95 backdrop-blur-sm px-2">
            <div 
                ref={scrollContainerRef}
                className="flex items-center gap-4 overflow-x-auto hide-scrollbar py-4 px-2 snap-x snap-mandatory"
            >
                {allSteps.map((step, idx) => {
                    const isActive = showStep0 ? idx === 0 : idx === activeStep + 1;
                    const isCompleted = showStep0
                        ? false
                        : idx === 0 || (idx > 0 && completedSteps.includes(idx - 1));
                    const isSkipped = !showStep0 && idx > 0 && skippedSteps.includes(idx - 1);

                    return (
                        <div key={step.id} className="flex items-center flex-shrink-0 snap-center">
                            {/* Step Item */}
                            <div className="flex flex-col items-center gap-2">
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${isActive
                                        ? 'bg-gradient-to-br from-blue-500 to-cyan-500 border-2 border-blue-400 shadow-lg shadow-blue-500/50 ring-4 ring-blue-500/20 scale-110'
                                        : isCompleted
                                            ? 'bg-gradient-to-br from-green-600 to-green-500 border-2 border-green-400'
                                            : isSkipped
                                                ? 'bg-gradient-to-br from-yellow-600 to-orange-500 border-2 border-yellow-400'
                                                : 'bg-card border-2 border-border'
                                        }`}
                                >
                                    {isCompleted ? (
                                        <Check className="w-6 h-6 text-foreground" />
                                    ) : isSkipped ? (
                                        <Ban className="w-5 h-5 text-foreground" />
                                    ) : (
                                        <span className={`text-xl ${isActive ? 'animate-pulse' : ''}`}>
                                            {step.icon}
                                        </span>
                                    )}
                                </div>
                                <p
                                    className={`text-xs font-medium text-center whitespace-nowrap max-w-[80px] overflow-hidden text-ellipsis transition-colors duration-300 ${isActive
                                        ? 'text-blue-400 font-bold'
                                        : isCompleted
                                            ? 'text-green-400'
                                            : isSkipped
                                                ? 'text-yellow-400'
                                                : 'text-gray-500'
                                        }`}
                                >
                                    {step.name}
                                </p>
                            </div>

                            {/* Horizontal Line Connector */}
                            {idx < allSteps.length - 1 && (
                                <div className="w-8 md:w-16 h-0.5 mx-2 bg-muted relative top-[-10px]">
                                    <div
                                        className={`h-full transition-all duration-500 ${isCompleted || isActive
                                            ? 'bg-gradient-to-r from-green-500 to-blue-500'
                                            : isSkipped
                                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                                : 'bg-muted'
                                            }`}
                                        style={{
                                            width: isCompleted ? '100%' : isActive ? '50%' : isSkipped ? '100%' : '0%',
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};
