import React, { useState, useEffect } from 'react';
import { RckikCheckboxItem } from './RckikCheckboxItem';
import { SelectedFavorites } from './SelectedFavorites';
import type { Step3FormProps, RckikBasic } from '@/types/auth';
import { fetchRckikList } from '@/lib/api/endpoints/rckik';

/**
 * Step3Form component
 * Trzeci krok rejestracji - wybór ulubionych RCKiK (opcjonalny)
 * Zawiera search input i listę checkboxów z RCKiK
 *
 * @param formData - Dane formularza dla kroku 3
 * @param onChange - Handler zmiany pola
 * @param onPrevious - Handler powrotu do poprzedniego kroku
 * @param onSkip - Handler pominięcia kroku
 * @param onSubmit - Handler wysłania formularza
 * @param isSubmitting - Czy formularz jest w trakcie wysyłania
 *
 * @example
 * <Step3Form
 *   formData={formData}
 *   onChange={updateField}
 *   onPrevious={goToPreviousStep}
 *   onSkip={() => submitForm()}
 *   onSubmit={submitForm}
 *   isSubmitting={isSubmitting}
 * />
 */
export function Step3Form({
  formData,
  onChange,
  onPrevious,
  onSkip,
  onSubmit,
  isSubmitting,
}: Step3FormProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [rckikList, setRckikList] = useState<RckikBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch RCKiK list on mount
  useEffect(() => {
    const loadRckikList = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all active RCKiK centers (no pagination limit for registration)
        const response = await fetchRckikList({
          page: 0,
          size: 100, // Get all centers
          active: true,
          sortBy: 'name',
          sortOrder: 'ASC',
          search: '',
          city: null,
        });

        // Map RckikSummary to RckikBasic
        const mappedData: RckikBasic[] = response.content.map((rckik) => ({
          id: rckik.id,
          name: rckik.name,
          city: rckik.city,
          latitude: rckik.latitude,
          longitude: rckik.longitude,
        }));

        setRckikList(mappedData);
      } catch (err) {
        console.error('Failed to fetch RCKiK list:', err);
        setError('Nie udało się pobrać listy centrów krwiodawstwa');
      } finally {
        setLoading(false);
      }
    };

    loadRckikList();
  }, []);

  // Filter RCKiK list by search term
  const filteredRckikList = rckikList.filter((rckik) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      rckik.name.toLowerCase().includes(searchLower) ||
      rckik.city.toLowerCase().includes(searchLower)
    );
  });

  // Get selected RCKiK objects
  const selectedRckiks = rckikList.filter((rckik) =>
    formData.favoriteRckikIds.includes(rckik.id)
  );

  // Toggle RCKiK selection
  const handleToggle = (id: number) => {
    const currentIds = formData.favoriteRckikIds;
    const newIds = currentIds.includes(id)
      ? currentIds.filter((selectedId) => selectedId !== id)
      : [...currentIds, id];
    onChange('favoriteRckikIds', newIds);
  };

  // Remove RCKiK from selection
  const handleRemove = (id: number) => {
    const newIds = formData.favoriteRckikIds.filter((selectedId) => selectedId !== id);
    onChange('favoriteRckikIds', newIds);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center" data-test-id="register-step3-header">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Ulubione centra
        </h2>
        <p className="text-sm text-gray-600">
          Krok 3 z 3: Wybierz ulubione centra krwiodawstwa (opcjonalnie)
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Będziesz otrzymywać powiadomienia o niskich stanach krwi w wybranych centrach
        </p>
      </div>

      {/* Search input */}
      <div>
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
          Wyszukaj centrum
        </label>
        <input
          type="text"
          id="search"
          data-test-id="register-rckik-search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Wpisz nazwę lub miasto..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-colors duration-200"
        />
      </div>

      {/* Selected favorites */}
      <SelectedFavorites
        selectedRckiks={selectedRckiks}
        onRemove={handleRemove}
      />

      {/* RCKiK list */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">
          Dostępne centra:
        </p>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-8">
            <svg
              className="animate-spin h-8 w-8 mx-auto text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">Ładowanie...</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="text-center py-8">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* RCKiK list */}
        {!loading && !error && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredRckikList.length === 0 ? (
              <p className="text-center py-8 text-sm text-gray-500">
                Nie znaleziono centrów pasujących do wyszukiwania
              </p>
            ) : (
              filteredRckikList.map((rckik) => (
                <RckikCheckboxItem
                  key={rckik.id}
                  rckik={rckik}
                  checked={formData.favoriteRckikIds.includes(rckik.id)}
                  onChange={(checked) => handleToggle(rckik.id)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex flex-col gap-3">
        {/* Submit button */}
        <button
          type="button"
          data-test-id="register-step3-submit-button"
          onClick={onSubmit}
          disabled={isSubmitting || loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium
            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:bg-gray-400 disabled:cursor-not-allowed
            transition-colors duration-200"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin h-5 w-5 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Rejestracja...
            </span>
          ) : (
            'Zarejestruj się'
          )}
        </button>

        {/* Skip or Previous buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            data-test-id="register-step3-previous-button"
            onClick={onPrevious}
            disabled={isSubmitting}
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium
              hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200"
          >
            Wstecz
          </button>

          <button
            type="button"
            data-test-id="register-step3-skip-button"
            onClick={onSkip}
            disabled={isSubmitting || loading}
            className="flex-1 bg-white text-gray-700 py-3 px-4 rounded-lg font-medium border border-gray-300
              hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200"
          >
            Pomiń
          </button>
        </div>
      </div>
    </div>
  );
}
