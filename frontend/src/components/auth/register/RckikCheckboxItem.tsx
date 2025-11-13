import React from 'react';
import type { RckikBasic } from '@/types/auth';

interface RckikCheckboxItemProps {
  rckik: RckikBasic;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * RckikCheckboxItem component
 * Pojedynczy checkbox item dla RCKiK w Step3Form
 * Wyświetla checkbox, nazwę centrum, i miasto
 *
 * @param rckik - Dane RCKiK
 * @param checked - Czy checkbox jest zaznaczony
 * @param onChange - Handler zmiany stanu checkbox
 *
 * @example
 * <RckikCheckboxItem
 *   rckik={rckik}
 *   checked={selectedIds.includes(rckik.id)}
 *   onChange={(checked) => handleToggle(rckik.id)}
 * />
 */
export function RckikCheckboxItem({ rckik, checked, onChange }: RckikCheckboxItemProps) {
  return (
    <label
      className={`
        flex items-start p-3 border rounded-lg cursor-pointer
        transition-all duration-200
        ${checked
          ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200'
          : 'bg-white border-gray-300 hover:border-gray-400'
        }
      `}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
      />
      <div className="ml-3 flex-1">
        <div className="font-medium text-gray-900">
          {rckik.name}
        </div>
        <div className="text-sm text-gray-600">
          {rckik.city}
        </div>
      </div>
      {checked && (
        <svg
          className="h-5 w-5 text-blue-600 ml-2"
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
      )}
    </label>
  );
}
