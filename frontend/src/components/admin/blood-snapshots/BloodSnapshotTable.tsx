import React, { useState } from 'react';
import type { BloodSnapshotResponse, SortConfig } from '@/lib/types/bloodSnapshots';

/**
 * Props dla BloodSnapshotTable
 */
interface BloodSnapshotTableProps {
  snapshots: BloodSnapshotResponse[];
  isLoading: boolean;
  onEdit: (snapshot: BloodSnapshotResponse) => void;
  onDelete: (snapshot: BloodSnapshotResponse) => void;
}

/**
 * BloodSnapshotTable - Tabela snapshotów z sortowaniem i mobile view
 *
 * Features:
 * - Sortowanie po kliknięciu nagłówków kolumn
 * - Desktop: table view
 * - Mobile (<768px): card view
 * - Akcje inline (Edit/Delete) tylko dla manual snapshots
 * - Badges dla źródła, grupy krwi, statusu poziomu
 * - Empty state
 *
 * US-028: Ręczne wprowadzanie stanów krwi
 */
export function BloodSnapshotTable({
  snapshots,
  isLoading,
  onEdit,
  onDelete,
}: BloodSnapshotTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: 'snapshotDate',
    direction: 'desc',
  });

  /**
   * Handle column sorting
   */
  const handleSort = (column: keyof BloodSnapshotResponse) => {
    setSortConfig((prev) => ({
      column,
      direction:
        prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  /**
   * Sort snapshots locally
   */
  const sortedSnapshots = React.useMemo(() => {
    if (!snapshots.length) return [];

    return [...snapshots].sort((a, b) => {
      const aValue = a[sortConfig.column];
      const bValue = b[sortConfig.column];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [snapshots, sortConfig]);

  /**
   * Sort indicator icon
   */
  const SortIcon = ({ column }: { column: keyof BloodSnapshotResponse }) => {
    if (sortConfig.column !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  /**
   * Get level status badge color
   */
  const getLevelStatusColor = (status: string) => {
    switch (status) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'IMPORTANT':
        return 'bg-yellow-100 text-yellow-800';
      case 'OK':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Loading state
   */
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-2 text-sm text-gray-500">Ładowanie...</p>
        </div>
      </div>
    );
  }

  /**
   * Empty state
   */
  if (sortedSnapshots.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Brak snapshotów</h3>
          <p className="mt-1 text-sm text-gray-500">
            Nie znaleziono żadnych snapshotów. Zmień filtry lub dodaj nowy snapshot.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                onClick={() => handleSort('snapshotDate')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Data</span>
                  <SortIcon column="snapshotDate" />
                </div>
              </th>
              <th
                onClick={() => handleSort('rckikName')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>RCKiK</span>
                  <SortIcon column="rckikName" />
                </div>
              </th>
              <th
                onClick={() => handleSort('bloodGroup')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Grupa krwi</span>
                  <SortIcon column="bloodGroup" />
                </div>
              </th>
              <th
                onClick={() => handleSort('levelPercentage')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Poziom</span>
                  <SortIcon column="levelPercentage" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Źródło
              </th>
              <th
                onClick={() => handleSort('createdAt')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Utworzono</span>
                  <SortIcon column="createdAt" />
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Akcje
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedSnapshots.map((snapshot) => (
              <tr key={snapshot.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(snapshot.snapshotDate).toLocaleDateString('pl-PL')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {snapshot.rckikName}
                  </div>
                  <div className="text-sm text-gray-500">{snapshot.rckikCode}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {snapshot.bloodGroup}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 mr-2">
                      {snapshot.levelPercentage.toFixed(2)}%
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getLevelStatusColor(snapshot.levelStatus)}`}>
                      {snapshot.levelStatus}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      snapshot.isManual
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {snapshot.isManual ? '✋ Ręcznie' : '🤖 Auto'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{new Date(snapshot.createdAt).toLocaleDateString('pl-PL')}</div>
                  {snapshot.createdBy && (
                    <div className="text-xs text-gray-400">{snapshot.createdBy}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {snapshot.isManual ? (
                    <div className="flex items-center justify-end space-x-3">
                      <button
                        onClick={() => onEdit(snapshot)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        Edytuj
                      </button>
                      <button
                        onClick={() => onDelete(snapshot)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        Usuń
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">Brak akcji</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-200">
        {sortedSnapshots.map((snapshot) => (
          <div key={snapshot.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-sm font-medium text-gray-900">{snapshot.rckikName}</h3>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {snapshot.bloodGroup}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{snapshot.rckikCode}</p>
              </div>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  snapshot.isManual ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                }`}
              >
                {snapshot.isManual ? '✋' : '🤖'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
              <div>
                <span className="text-gray-500">Data:</span>
                <p className="font-medium text-gray-900">
                  {new Date(snapshot.snapshotDate).toLocaleDateString('pl-PL')}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Poziom:</span>
                <div className="flex items-center space-x-1">
                  <p className="font-medium text-gray-900">{snapshot.levelPercentage.toFixed(2)}%</p>
                  <span className={`px-1.5 py-0.5 text-xs font-semibold rounded ${getLevelStatusColor(snapshot.levelStatus)}`}>
                    {snapshot.levelStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 mb-3">
              Utworzono: {new Date(snapshot.createdAt).toLocaleDateString('pl-PL')}
              {snapshot.createdBy && <> • {snapshot.createdBy}</>}
            </div>

            {snapshot.isManual && (
              <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => onEdit(snapshot)}
                  className="flex-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                >
                  Edytuj
                </button>
                <button
                  onClick={() => onDelete(snapshot)}
                  className="flex-1 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                >
                  Usuń
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
