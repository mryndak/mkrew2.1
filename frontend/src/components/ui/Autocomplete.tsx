import { useState, useRef, useEffect, useId } from 'react';
import type { InputHTMLAttributes } from 'react';

export interface AutocompleteOption {
  value: string | number;
  label: string;
  subtitle?: string;
}

export interface AutocompleteProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: AutocompleteOption[];
  value?: string | number;
  onChange: (value: string | number, option: AutocompleteOption | null) => void;
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
  noResultsText?: string;
  minSearchLength?: number;
}

/**
 * Autocomplete component - Searchable dropdown dla wyszukiwania po fragmencie nazwy
 * Features:
 * - Filtrowanie po wpisanym tekście (case-insensitive)
 * - Keyboard navigation (arrow up/down, enter, escape)
 * - Highlight zaznaczonej opcji
 * - Click outside to close
 * - Accessibility (aria attributes)
 * - Support for subtitle (np. miasto)
 */
export function Autocomplete({
  label,
  error,
  helperText,
  options,
  value,
  onChange,
  placeholder = 'Szukaj...',
  className = '',
  wrapperClassName = '',
  noResultsText = 'Brak wyników',
  minSearchLength = 1,
  id,
  disabled = false,
  ...props
}: AutocompleteProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const listId = `${inputId}-listbox`;

  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  /**
   * Get display text from selected value
   */
  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : '';

  /**
   * Filter options based on search term
   */
  const filteredOptions = options.filter((option) => {
    if (searchTerm.length < minSearchLength) {
      return true;
    }
    const searchLower = searchTerm.toLowerCase();
    const labelMatch = option.label.toLowerCase().includes(searchLower);
    const subtitleMatch = option.subtitle?.toLowerCase().includes(searchLower);
    return labelMatch || subtitleMatch;
  });

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Scroll highlighted item into view
   */
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;

      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        inputRef.current?.blur();
        break;

      case 'Tab':
        setIsOpen(false);
        setSearchTerm('');
        break;
    }
  };

  /**
   * Handle option select
   */
  const handleSelect = (option: AutocompleteOption) => {
    onChange(option.value, option);
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    setHighlightedIndex(0);

    // If user clears input, clear selection
    if (newValue === '') {
      onChange('', null);
    }
  };

  /**
   * Handle input focus
   */
  const handleInputFocus = () => {
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const inputClasses = [
    'w-full px-4 py-2.5 pr-10 rounded-lg border transition-all duration-200',
    'text-gray-900 bg-white placeholder-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
    disabled && 'bg-gray-100 cursor-not-allowed opacity-60',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`w-full ${wrapperClassName}`} ref={wrapperRef}>
      {/* Label */}
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative">
        {/* Input */}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          className={inputClasses}
          value={isOpen ? searchTerm : displayText}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-activedescendant={
            highlightedIndex >= 0 ? `${inputId}-option-${highlightedIndex}` : undefined
          }
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />

        {/* Dropdown icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Dropdown list */}
        {isOpen && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-500 text-center">{noResultsText}</li>
            ) : (
              filteredOptions.map((option, index) => (
                <li
                  key={option.value}
                  id={`${inputId}-option-${index}`}
                  role="option"
                  aria-selected={option.value === value}
                  className={[
                    'px-4 py-2.5 cursor-pointer transition-colors duration-150',
                    highlightedIndex === index
                      ? 'bg-primary-50 text-primary-900'
                      : 'hover:bg-gray-50',
                    option.value === value && 'bg-primary-100 font-medium',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-900">{option.label}</span>
                    {option.subtitle && (
                      <span className="text-xs text-gray-500 mt-0.5">{option.subtitle}</span>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
}
