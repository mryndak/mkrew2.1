import React, { useState, useRef, useEffect } from 'react';
import type { RckikBasicDto } from '@/lib/types/scraper';

/**
 * RckikMultiSelect - Multi-select z wyszukiwaniem dla wyboru centrów krwi
 *
 * Features:
 * - Wybór wszystkich centrów
 * - Wybór jednego centrum
 * - Wybór kilku centrów (multi-select)
 * - Funkcja wyszukiwania
 * - Dropdown z checkboxami
 */

interface RckikMultiSelectProps {
  options: RckikBasicDto[];
  selectedIds: number[];
  onChange: (selectedIds: number[]) => void;
  disabled?: boolean;
  error?: string;
}

export function RckikMultiSelect({
  options,
  selectedIds,
  onChange,
  disabled = false,
  error,
}: RckikMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtrowane opcje na podstawie wyszukiwania
  const filteredOptions = options.filter(
    (option) =>
      option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if all are selected
  const allSelected = selectedIds.length === 0;
  const someSelected = selectedIds.length > 0 && selectedIds.length < options.length;

  // Display text
  const getDisplayText = () => {
    if (allSelected) {
      return `Wszystkie centra (${options.length})`;
    }
    if (selectedIds.length === 1) {
      const selected = options.find((opt) => opt.id === selectedIds[0]);
      return selected ? `${selected.name} - ${selected.city}` : '1 centrum';
    }
    return `Wybrano ${selectedIds.length} centr${selectedIds.length === 2 || selectedIds.length === 3 || selectedIds.length === 4 ? 'a' : ''}`;
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchQuery('');
      }
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    onChange([]);
    setSearchQuery('');
  };

  // Handle select one
  const handleToggleOption = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  // Handle clear selection
  const handleClearAll = () => {
    onChange([]);
    setSearchQuery('');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Select button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={`relative w-full bg-white border ${
          error ? 'border-red-300' : 'border-gray-300'
        } rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 ${
          error ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-primary-500 focus:border-primary-500'
        } sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed`}
      >
        <span className="block truncate">{getDisplayText()}</span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-96 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {/* Search input */}
          <div className="sticky top-0 z-10 bg-white px-3 py-2 border-b border-gray-200">
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Szukaj centrum..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Actions */}
          <div className="sticky top-[52px] z-10 bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs font-medium text-primary-600 hover:text-primary-800"
            >
              Wszystkie
            </button>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs font-medium text-gray-600 hover:text-gray-800"
              >
                Wyczyść ({selectedIds.length})
              </button>
            )}
          </div>

          {/* Options list */}
          <div className="py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">Nie znaleziono centrów</div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = allSelected || selectedIds.includes(option.id);
                return (
                  <div
                    key={option.id}
                    onClick={() => handleToggleOption(option.id)}
                    className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 ${
                      isSelected ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <div className="ml-3">
                        <span className={`block text-sm ${isSelected ? 'font-semibold' : 'font-normal'}`}>
                          {option.name}
                        </span>
                        <span className="block text-xs text-gray-500">
                          {option.city} • {option.code}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {/* Help text */}
      <p className="mt-1 text-xs text-gray-500">
        {allSelected
          ? 'Wybrano wszystkie centra'
          : selectedIds.length === 0
          ? 'Kliknij aby wybrać centra'
          : `Wybrano ${selectedIds.length} z ${options.length} centrów`}
      </p>
    </div>
  );
}
