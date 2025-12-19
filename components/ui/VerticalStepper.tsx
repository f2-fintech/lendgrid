import { Check } from 'lucide-react';

interface Step {
    id: number;
    name: string;
    icon: string;
}

interface Props {
    steps: Step[];
    activeStep: number;
    completedSteps: number[];
    showStep0: boolean;
}

export const VerticalStepper: React.FC<Props> = ({
    steps,
    activeStep,
    completedSteps,
    showStep0,
}) => {
    return (
        <div className="sticky top-1/2 -translate-y-1/2 h-[600px] flex items-center">
            <div className="space-y-10">
                {steps.map((step, idx) => {
                    const isActive = showStep0 ? idx === 0 : idx === activeStep + 1;
                    const isCompleted = showStep0
                        ? false
                        : idx === 0 || completedSteps.includes(idx - 1);

                    return (
                        <div key={step.id} className="relative flex gap-5">
                            {/* Vertical line */}
                            {idx < steps.length - 1 && (
                                <div className="absolute left-8 top-16 w-[3px] h-20 bg-gray-700">
                                    <div
                                        className={`h-full transition-all duration-500 ${isCompleted || isActive
                                            ? 'bg-gradient-to-b from-green-500 to-blue-500'
                                            : 'bg-gray-700'
                                            }`}
                                    //  style={{
                                    //         height: isCompleted ? '100%' : isActive ? '50%' : '0%',
                                    //     }}
                                    />
                                </div>
                            )}

                            {/* Icon */}
                            <div
                                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isActive
                                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500 ring-4 ring-blue-500/30 scale-110'
                                    : isCompleted
                                        ? 'bg-gradient-to-br from-green-600 to-green-500'
                                        : 'bg-gray-800'
                                    }`}
                            >
                                {isCompleted ? (
                                    <Check className="w-8 h-8 text-white" />
                                ) : (
                                    <span className={`text-xl ${isActive ? 'animate-pulse' : ''}`}>
                                        {step.icon}
                                    </span>
                                )}
                            </div>

                            {/* Text */}
                            <div className="pt-3">
                                <p
                                    className={`text-base font-semibold ${isActive
                                        ? 'text-blue-400'
                                        : isCompleted
                                            ? 'text-green-400'
                                            : 'text-gray-500'
                                        }`}
                                >
                                    {step.name}
                                </p>

                                {isActive && (
                                    <p className="text-xs text-gray-400">In Progress</p>
                                )}
                                {isCompleted && (
                                    <p className="text-xs text-green-500">Completed</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
