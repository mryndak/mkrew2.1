import React from 'react';
import { checkPasswordRequirements } from '@/types/auth';

interface PasswordRequirementsChecklistProps {
  password: string;
}

/**
 * PasswordRequirementsChecklist component
 * Wyświetla listę wymagań dla hasła z checkmarkami (✓/✗)
 * Pokazuje użytkownikowi, które wymagania zostały spełnione
 *
 * @param password - Hasło do sprawdzenia
 *
 * @example
 * <PasswordRequirementsChecklist password={formData.password} />
 */
export function PasswordRequirementsChecklist({ password }: PasswordRequirementsChecklistProps) {
  const requirements = checkPasswordRequirements(password);

  // Nie pokazuj checklisty jeśli hasło jest puste
  if (!password) {
    return null;
  }

  // Lista wymagań z labelami
  const requirementsList = [
    { key: 'minLength', label: 'Co najmniej 8 znaków', met: requirements.minLength },
    { key: 'hasUppercase', label: 'Jedna wielka litera', met: requirements.hasUppercase },
    { key: 'hasLowercase', label: 'Jedna mała litera', met: requirements.hasLowercase },
    { key: 'hasDigit', label: 'Jedna cyfra', met: requirements.hasDigit },
    { key: 'hasSpecialChar', label: 'Jeden znak specjalny (@$!%*?&#)', met: requirements.hasSpecialChar },
  ];

  return (
    <div className="mt-3" data-test-id="password-requirements-checklist">
      <p className="text-xs font-medium text-gray-600 mb-2">
        Wymagania dla hasła:
      </p>
      <ul className="space-y-1">
        {requirementsList.map((req) => (
          <li
            key={req.key}
            data-test-id={`password-requirement-${req.key}`}
            className="flex items-center text-xs"
          >
            {/* Ikona checkmark lub X */}
            {req.met ? (
              <svg
                className="w-4 h-4 mr-2 text-green-500 flex-shrink-0"
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
              <svg
                className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            <span className={req.met ? 'text-gray-700' : 'text-gray-500'}>
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
