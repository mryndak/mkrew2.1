import React from 'react';
import type { ProgressBarProps } from '@/types/auth';

/**
 * ProgressBar component
 * Wskaźnik postępu pokazujący aktualne miejsce w procesie rejestracji (krok 1/3, 2/3, 3/3)
 * Wizualna reprezentacja z aktywnym krokiem highlighted, completed steps z checkmarkiem, i future steps greyed out
 *
 * @param currentStep - Aktualny krok (1, 2, or 3)
 * @param completedSteps - Tablica ukończonych kroków [1, 2, ...]
 *
 * @example
 * <ProgressBar currentStep={2} completedSteps={[1]} />
 */
export function ProgressBar({ currentStep, completedSteps }: ProgressBarProps) {
  const steps = [
    { number: 1, label: 'Konto', description: 'Dane logowania' },
    { number: 2, label: 'Dane osobowe', description: 'Imię i nazwisko' },
    { number: 3, label: 'Ulubione', description: 'Centra krwiodawstwa' },
  ];

  const getStepStatus = (stepNumber: number): 'completed' | 'current' | 'upcoming' => {
    if (completedSteps.includes(stepNumber)) {
      return 'completed';
    }
    if (stepNumber === currentStep) {
      return 'current';
    }
    return 'upcoming';
  };

  const calculateProgressPercentage = (): number => {
    // Progress based on current step
    // Step 1 = 0%, Step 2 = 50%, Step 3 = 100%
    return ((currentStep - 1) / (steps.length - 1)) * 100;
  };

  return (
    <nav aria-label="Progress" className="mb-8">
      {/* Progress bar visual */}
      <div className="relative">
        {/* Background line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" aria-hidden="true" />

        {/* Filled progress line */}
        <div
          className="absolute top-5 left-0 h-0.5 bg-blue-600 transition-all duration-500 ease-in-out"
          style={{ width: `${calculateProgressPercentage()}%` }}
          aria-hidden="true"
        />

        {/* Steps */}
        <ol className="relative z-10 flex justify-between">
          {steps.map((step) => {
            const status = getStepStatus(step.number);

            return (
              <li key={step.number} className="flex flex-col items-center flex-1">
                {/* Step circle/checkmark */}
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2
                    transition-all duration-300
                    ${
                      status === 'completed'
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : status === 'current'
                        ? 'bg-white border-blue-600 text-blue-600 ring-4 ring-blue-100'
                        : 'bg-white border-gray-300 text-gray-400'
                    }
                  `}
                  aria-current={status === 'current' ? 'step' : undefined}
                >
                  {status === 'completed' ? (
                    // Checkmark icon for completed steps
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    // Step number
                    <span className="text-sm font-semibold">{step.number}</span>
                  )}
                </div>

                {/* Step label */}
                <div className="mt-2 text-center">
                  <p
                    className={`
                      text-sm font-medium
                      ${
                        status === 'current'
                          ? 'text-blue-600'
                          : status === 'completed'
                          ? 'text-gray-900'
                          : 'text-gray-500'
                      }
                    `}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500 hidden sm:block mt-0.5">
                    {step.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Mobile-friendly current step indicator */}
      <div className="mt-4 text-center sm:hidden">
        <p className="text-sm text-gray-600">
          Krok <span className="font-semibold text-blue-600">{currentStep}</span> z {steps.length}
        </p>
      </div>
    </nav>
  );
}
