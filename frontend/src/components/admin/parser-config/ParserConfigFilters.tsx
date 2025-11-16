import { useState, useEffect } from 'react';
import { RckikSearchSelect } from '@/components/admin/blood-snapshots/RckikSearchSelect';
import { Select } from '@/components/ui/Select';
import type { ParserConfigFiltersProps, ParserType } from '@/lib/types/parserConfig';

/**
 * ParserConfigFilters - Panel filtrów dla listy konfiguracji parserów
 *
 * Features:
 * - RckikFilter - typeahead dropdown z wyszukiwaniem RCKiK
 * - ParserTypeFilter - dropdown: JSOUP, SELENIUM, CUSTOM, Wszystkie
 * - ActiveStatusFilter - toggle: Wszystkie / Aktywne / Nieaktywne
 * - ClearFiltersButton - resetuje wszystkie filtry
 * - Synchronizacja z query params (shareable URLs)
 *
 * US-029, US-030: Zarządzanie konfiguracją parserów
 *
 * @example
 * ```tsx
 * <ParserConfigFilters
 *   onFiltersChange={handleFiltersChange}
 *   initialFilters={{ rckikId: 1, parserType: 'CUSTOM', active: true }}
 * />
 * ```
 */
export function ParserConfigFilters({
  onFiltersChange,
  initialFilters,
}: ParserConfigFiltersProps) {
  const [rckikId, setRckikId] = useState<number | null>(initialFilters?.rckikId ?? null);
  const [parserType, setParserType] = useState<ParserType | null>(
    initialFilters?.parserType ?? null
  );
  const [activeStatus, setActiveStatus] = useState<boolean | null>(
    initialFilters?.active ?? null
  );

  /**
   * Emituj zmiany filtrów do parenta
   */
  useEffect(() => {
    onFiltersChange({
      rckikId,
      parserType,
      active: activeStatus,
    });
  }, [rckikId, parserType, activeStatus, onFiltersChange]);

  /**
   * Resetuj wszystkie filtry
   */
  const handleClearFilters = () => {
    setRckikId(null);
    setParserType(null);
    setActiveStatus(null);
  };

  /**
   * Sprawdź czy jakiekolwiek filtry są aktywne
   */
  const hasActiveFilters = rckikId !== null || parserType !== null || activeStatus !== null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">Filtry</h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Wyczyść filtry
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* RCKiK Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Centrum RCKiK
          </label>
          <RckikSearchSelect
            value={rckikId}
            onChange={(id) => setRckikId(id)}
          />
        </div>

        {/* Parser Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Typ parsera
          </label>
          <select
            value={parserType ?? ''}
            onChange={(e) => setParserType(e.target.value ? (e.target.value as ParserType) : null)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Wszystkie</option>
            <option value="JSOUP">JSOUP</option>
            <option value="SELENIUM">Selenium</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>

        {/* Active Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status aktywności
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveStatus(null)}
              className={`
                flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors
                ${
                  activeStatus === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              Wszystkie
            </button>
            <button
              onClick={() => setActiveStatus(true)}
              className={`
                flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors
                ${
                  activeStatus === true
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              Aktywne
            </button>
            <button
              onClick={() => setActiveStatus(false)}
              className={`
                flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors
                ${
                  activeStatus === false
                    ? 'bg-gray-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              Nieaktywne
            </button>
          </div>
        </div>
      </div>

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Aktywne filtry:{' '}
            {[
              rckikId && 'RCKiK',
              parserType && `Typ: ${parserType}`,
              activeStatus !== null && (activeStatus ? 'Aktywne' : 'Nieaktywne'),
            ]
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
