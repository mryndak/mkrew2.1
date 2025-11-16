import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import type { ParseResultsPreviewProps, ParsedDataEntry } from '@/lib/types/parserConfig';

/**
 * ParseResultsPreview - Komponent do wyświetlania preview wyników parsowania z testu dry-run
 *
 * Features:
 * - Tabela z wynikami parsowania (grupa krwi, poziom, status, selektor, raw text)
 * - Badges dla statusu poziomu (OK/IMPORTANT/CRITICAL)
 * - Collapsible source info (selektor + raw text)
 * - Alerts dla warnings i errors
 * - Empty state jeśli brak danych
 *
 * US-029, US-030: Testowanie parserów przed aktywacją
 */
export function ParseResultsPreview({
  parsedData,
  warnings,
  errors,
}: ParseResultsPreviewProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  /**
   * Toggle expanded row (show/hide raw text)
   */
  const toggleRow = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  /**
   * Get badge variant for level status
   */
  const getLevelStatusBadge = (status: string) => {
    switch (status) {
      case 'OK':
        return <Badge variant="success" size="small">OK</Badge>;
      case 'IMPORTANT':
        return <Badge variant="warning" size="small">Ważne</Badge>;
      case 'CRITICAL':
        return <Badge variant="error" size="small">Krytyczne</Badge>;
      default:
        return <Badge variant="neutral" size="small">Nieznany</Badge>;
    }
  };

  /**
   * Empty state
   */
  if (parsedData.length === 0 && warnings.length === 0 && errors.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Brak wyników do wyświetlenia</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Errors */}
      {errors.length > 0 && (
        <Alert variant="error" title="Błędy parsowania">
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, idx) => (
              <li key={idx} className="text-sm">{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert variant="warning" title="Ostrzeżenia">
          <ul className="list-disc list-inside space-y-1">
            {warnings.map((warning, idx) => (
              <li key={idx} className="text-sm">{warning}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Results Table */}
      {parsedData.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Sparsowane dane ({parsedData.length} grup krwi)
          </h4>
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grupa krwi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Poziom (%)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Źródło
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parsedData.map((entry, idx) => (
                  <React.Fragment key={idx}>
                    <tr className="hover:bg-gray-50">
                      {/* Blood Group */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {entry.bloodGroup}
                        </span>
                      </td>

                      {/* Level Percentage */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {entry.levelPercentage.toFixed(2)}%
                        </span>
                      </td>

                      {/* Level Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getLevelStatusBadge(entry.levelStatus)}
                      </td>

                      {/* Source (Collapsible) */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleRow(idx)}
                          className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <svg
                            className={`w-4 h-4 mr-1 transition-transform ${
                              expandedRows.has(idx) ? 'rotate-90' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                          {expandedRows.has(idx) ? 'Ukryj szczegóły' : 'Pokaż szczegóły'}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Row - Source Details */}
                    {expandedRows.has(idx) && (
                      <tr>
                        <td colSpan={4} className="px-4 py-3 bg-gray-50">
                          <div className="space-y-2">
                            <div>
                              <span className="text-xs font-medium text-gray-500">
                                Selektor CSS:
                              </span>
                              <code className="block mt-1 text-xs bg-white border border-gray-200 rounded px-2 py-1 font-mono">
                                {entry.source.selector}
                              </code>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500">
                                Raw text:
                              </span>
                              <div className="mt-1 text-xs bg-white border border-gray-200 rounded px-2 py-1">
                                {entry.source.rawText}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
