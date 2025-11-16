import { Input } from '@/components/ui/Input';
import type { UrlInputProps } from '@/lib/types/parserConfig';

/**
 * UrlInput - Input z walidacją URL (musi zaczynać się od https://)
 *
 * Features:
 * - Ikona HTTPS na początku
 * - Walidacja HTTPS URL
 * - Error message pod inputem
 * - Placeholder z przykładowym URL
 *
 * US-029, US-030: Zarządzanie konfiguracją parserów
 *
 * @example
 * ```tsx
 * <UrlInput
 *   value={formData.sourceUrl}
 *   onChange={handleChange}
 *   error={errors.sourceUrl}
 *   placeholder="https://rckik.rzeszow.pl/zapasy-krwi"
 * />
 * ```
 */
export function UrlInput({
  value,
  onChange,
  error,
  placeholder = 'https://example.com',
}: UrlInputProps) {
  return (
    <div className="w-full">
      <label htmlFor="sourceUrl" className="block text-sm font-medium text-gray-700 mb-1">
        URL źródłowy <span className="text-red-500">*</span>
      </label>

      <div className="relative">
        {/* HTTPS Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* Input field */}
        <input
          id="sourceUrl"
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`
            block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            sm:text-sm
            ${error ? 'border-red-300 text-red-900 placeholder-red-300' : 'border-gray-300'}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'sourceUrl-error' : undefined}
        />
      </div>

      {/* Error message */}
      {error && (
        <p id="sourceUrl-error" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Helper text */}
      {!error && (
        <p className="mt-1 text-xs text-gray-500">
          URL musi zaczynać się od <code className="bg-gray-100 px-1 rounded">https://</code>
        </p>
      )}
    </div>
  );
}
