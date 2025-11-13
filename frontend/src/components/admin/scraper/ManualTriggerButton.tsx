import React, { useState } from 'react';
import { ManualTriggerModal } from './ManualTriggerModal';
import type { RckikBasicDto } from '@/lib/types/scraper';

/**
 * ManualTriggerButton - Przycisk do ręcznego uruchamiania scrapera
 *
 * Features:
 * - Otwiera ManualTriggerModal
 * - Callback po sukcesie
 * - Disabled state (opcjonalny)
 */

interface ManualTriggerButtonProps {
  rckikOptions?: RckikBasicDto[];
  onSuccess?: (runId: number) => void;
  disabled?: boolean;
  className?: string;
}

export function ManualTriggerButton({
  rckikOptions = [],
  onSuccess,
  disabled = false,
  className = '',
}: ManualTriggerButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = (runId: number) => {
    setIsModalOpen(false);
    onSuccess?.(runId);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
        aria-label="Uruchom scraper ręcznie"
      >
        <svg
          className="h-5 w-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Uruchom Scraper
      </button>

      <ManualTriggerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        rckikOptions={rckikOptions}
      />
    </>
  );
}
