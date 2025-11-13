import React from 'react';
import { FieldError } from '@/components/forms/FieldError';
import { BloodGroupSelect } from './BloodGroupSelect';
import type { Step2FormProps } from '@/types/auth';

/**
 * Step2Form component
 * Drugi krok rejestracji - zbiera imię, nazwisko, i grupę krwi (opcjonalnie)
 *
 * @param formData - Dane formularza dla kroku 2
 * @param errors - Błędy walidacji
 * @param onChange - Handler zmiany pola
 * @param onPrevious - Handler powrotu do poprzedniego kroku
 * @param onNext - Handler przejścia do następnego kroku
 *
 * @example
 * <Step2Form
 *   formData={formData}
 *   errors={errors}
 *   onChange={updateField}
 *   onPrevious={goToPreviousStep}
 *   onNext={goToNextStep}
 * />
 */
export function Step2Form({
  formData,
  errors,
  onChange,
  onPrevious,
  onNext,
}: Step2FormProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Dane osobowe
        </h2>
        <p className="text-sm text-gray-600">
          Krok 2 z 3: Uzupełnij swoje dane
        </p>
      </div>

      {/* First name field */}
      <div>
        <label
          htmlFor="firstName"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Imię *
        </label>
        <input
          type="text"
          id="firstName"
          value={formData.firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
          autoComplete="given-name"
          aria-invalid={!!errors.firstName}
          aria-describedby={errors.firstName ? 'firstName-error' : undefined}
          className={`
            w-full px-3 py-2 border rounded-lg shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-colors duration-200
            ${errors.firstName ? 'border-red-500' : 'border-gray-300'}
          `}
          placeholder="Jan"
        />
        {errors.firstName && <FieldError message={errors.firstName} />}
      </div>

      {/* Last name field */}
      <div>
        <label
          htmlFor="lastName"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Nazwisko *
        </label>
        <input
          type="text"
          id="lastName"
          value={formData.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
          autoComplete="family-name"
          aria-invalid={!!errors.lastName}
          aria-describedby={errors.lastName ? 'lastName-error' : undefined}
          className={`
            w-full px-3 py-2 border rounded-lg shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-colors duration-200
            ${errors.lastName ? 'border-red-500' : 'border-gray-300'}
          `}
          placeholder="Kowalski"
        />
        {errors.lastName && <FieldError message={errors.lastName} />}
      </div>

      {/* Blood group select */}
      <BloodGroupSelect
        value={formData.bloodGroup}
        onChange={(value) => onChange('bloodGroup', value)}
        error={errors.bloodGroup}
      />

      {/* Navigation buttons */}
      <div className="flex gap-3">
        {/* Previous button */}
        <button
          type="button"
          onClick={onPrevious}
          className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium
            hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
            transition-colors duration-200"
        >
          Wstecz
        </button>

        {/* Next button */}
        <button
          type="button"
          onClick={onNext}
          className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium
            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            transition-colors duration-200"
        >
          Dalej
        </button>
      </div>

      {/* Required fields notice */}
      <p className="text-xs text-gray-500 text-center">
        * Pole wymagane
      </p>
    </div>
  );
}
