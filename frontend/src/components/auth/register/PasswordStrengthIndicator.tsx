import React from 'react';
import { calculatePasswordStrength, type PasswordStrength } from '@/types/auth';

interface PasswordStrengthIndicatorProps {
  password: string;
}

/**
 * PasswordStrengthIndicator component
 * Wyświetla wizualny wskaźnik siły hasła (weak/medium/strong)
 * Pokazuje pasek wypełniony kolorem odpowiadającym sile hasła
 *
 * @param password - Hasło do sprawdzenia
 *
 * @example
 * <PasswordStrengthIndicator password={formData.password} />
 */
export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = calculatePasswordStrength(password);

  // Nie pokazuj wskaźnika jeśli hasło jest puste
  if (!password) {
    return null;
  }

  // Konfiguracja kolorów i szerokości dla różnych poziomów siły
  const strengthConfig: Record<PasswordStrength, { width: string; color: string; label: string }> = {
    weak: {
      width: 'w-1/3',
      color: 'bg-red-500',
      label: 'Słabe',
    },
    medium: {
      width: 'w-2/3',
      color: 'bg-yellow-500',
      label: 'Średnie',
    },
    strong: {
      width: 'w-full',
      color: 'bg-green-500',
      label: 'Silne',
    },
  };

  const config = strengthConfig[strength];

  return (
    <div className="mt-2" data-test-id="password-strength-indicator">
      {/* Label */}
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-600">
          Siła hasła:
        </span>
        <span className={`text-xs font-semibold ${
          strength === 'weak' ? 'text-red-600' :
          strength === 'medium' ? 'text-yellow-600' :
          'text-green-600'
        }`} data-test-id="password-strength-label">
          {config.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${config.color} ${config.width} transition-all duration-300 ease-in-out`}
          data-test-id="password-strength-bar"
          role="progressbar"
          aria-valuenow={strength === 'weak' ? 33 : strength === 'medium' ? 66 : 100}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Siła hasła: ${config.label}`}
        />
      </div>
    </div>
  );
}
