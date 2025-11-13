import React, { forwardRef, useState } from 'react';
import type { RememberMeCheckboxProps } from '@/types/auth';

/**
 * RememberMeCheckbox component
 * Checkbox "Zapamiętaj mnie" z tooltipem ostrzegającym o security implications
 *
 * @param checked - Stan checkboxa
 * @param onChange - Handler zmiany stanu
 * @param disabled - Czy checkbox jest disabled
 *
 * @example
 * <RememberMeCheckbox
 *   {...register('rememberMe')}
 *   disabled={isSubmitting}
 * />
 */
export const RememberMeCheckbox = forwardRef<
  HTMLInputElement,
  Omit<RememberMeCheckboxProps, 'checked' | 'onChange'> & {
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }
>(({ disabled, onChange, ...props }, ref) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="mb-4 flex items-center">
      <input
        ref={ref}
        type="checkbox"
        id="rememberMe"
        disabled={disabled}
        onChange={onChange}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
        {...props}
      />
      <label
        htmlFor="rememberMe"
        className="ml-2 block text-sm text-gray-700 flex items-center gap-1"
      >
        Zapamiętaj mnie
        <div className="relative inline-block">
          <button
            type="button"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
            aria-label="Informacja o zapamiętaniu logowania"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {showTooltip && (
            <div
              role="tooltip"
              className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg"
            >
              <div className="relative">
                Nie zaznaczaj tej opcji na urządzeniach publicznych lub współdzielonych
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                  <div className="border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </label>
    </div>
  );
});

RememberMeCheckbox.displayName = 'RememberMeCheckbox';
