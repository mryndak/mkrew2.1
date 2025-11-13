import React from 'react';
import { BLOOD_GROUPS, type BloodGroup } from '@/types/auth';
import { FieldError } from '@/components/forms/FieldError';

interface BloodGroupSelectProps {
  value: BloodGroup | null;
  onChange: (value: BloodGroup | null) => void;
  error?: string;
}

/**
 * BloodGroupSelect component
 * Dropdown do wyboru grupy krwi (8 opcji + "Nie wiem/Wolę nie podawać")
 * Pole opcjonalne
 *
 * @param value - Wybrana grupa krwi
 * @param onChange - Handler zmiany wartości
 * @param error - Komunikat błędu walidacji
 *
 * @example
 * <BloodGroupSelect
 *   value={formData.bloodGroup}
 *   onChange={(value) => onChange('bloodGroup', value)}
 *   error={errors.bloodGroup}
 * />
 */
export function BloodGroupSelect({ value, onChange, error }: BloodGroupSelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    onChange(selectedValue === '' ? null : (selectedValue as BloodGroup));
  };

  return (
    <div>
      <label
        htmlFor="bloodGroup"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Grupa krwi (opcjonalnie)
      </label>
      <select
        id="bloodGroup"
        value={value || ''}
        onChange={handleChange}
        aria-invalid={!!error}
        aria-describedby={error ? 'bloodGroup-error' : undefined}
        className={`
          w-full px-3 py-2 border rounded-lg shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-colors duration-200
          bg-white
          ${error ? 'border-red-500' : 'border-gray-300'}
        `}
      >
        <option value="">Nie wiem / Wolę nie podawać</option>
        {BLOOD_GROUPS.map((group) => (
          <option key={group} value={group}>
            {group}
          </option>
        ))}
      </select>
      {error && <FieldError message={error} />}
      <p className="mt-1 text-xs text-gray-500">
        Podanie grupy krwi pomoże nam lepiej dopasować powiadomienia o niskich stanach
      </p>
    </div>
  );
}
