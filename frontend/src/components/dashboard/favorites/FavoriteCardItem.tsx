import { useState } from 'react';
import type { FavoriteRckikDto } from '@/types/rckik';
import { BloodLevelBadge } from '@/components/rckik/BloodLevelBadge';
import { useAppDispatch } from '@/lib/store';
import {
  removeFavorite,
  optimisticRemoveFavorite,
  rollbackOptimisticUpdate,
} from '@/lib/store/slices/favoritesSlice';
import { toast } from 'sonner';
import { ConfirmModal } from './ConfirmModal';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * FavoriteCardItem - Karta pojedynczego ulubionego centrum (sortable)
 *
 * Features:
 * - Drag-and-drop (useSortable hook)
 * - Drag handle (ikona uchwytu) z hover effect
 * - Nazwa centrum, miasto, kod, adres
 * - Aktualne poziomy krwi (BloodLevelBadge x 8)
 * - Alert dla krytycznych poziomów krwi
 * - Przycisk "Zobacz szczegóły" → /rckik/[id]
 * - Przycisk "Usuń" z modalem potwierdzenia
 * - Wskaźnik priorytetu (opcjonalny)
 * - Hover effects i dragging state
 * - Optimistic updates z rollback
 * - Keyboard navigation dla drag-and-drop
 *
 * @example
 * ```tsx
 * <FavoriteCardItem favorite={favoriteData} index={0} />
 * ```
 */

interface FavoriteCardItemProps {
  favorite: FavoriteRckikDto;
  index: number;
}

export function FavoriteCardItem({ favorite, index }: FavoriteCardItemProps) {
  const dispatch = useAppDispatch();
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const { rckikId, name, city, code, address, currentBloodLevels, priority } = favorite;

  // Sortable hook for drag-and-drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: favorite.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Check for critical blood levels
  const hasCriticalLevels = currentBloodLevels?.some(
    (level) => level.levelStatus === 'CRITICAL'
  );

  // Handle remove with optimistic update
  const handleRemove = async () => {
    setIsRemoveModalOpen(false);
    setIsRemoving(true);

    // Optimistic update
    dispatch(optimisticRemoveFavorite(rckikId));

    try {
      await dispatch(removeFavorite(rckikId)).unwrap();
      toast.success(`Usunięto ${name} z ulubionych`);
    } catch (error: any) {
      // Rollback
      dispatch(rollbackOptimisticUpdate({ rckikId, wasAdded: false }));
      toast.error(error || 'Nie udało się usunąć z ulubionych');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`
          bg-white rounded-lg border shadow-sm
          transition-all duration-200
          ${hasCriticalLevels ? 'border-red-300' : 'border-gray-200'}
          ${isRemoving ? 'opacity-50 pointer-events-none' : 'hover:shadow-md'}
          ${isDragging ? 'opacity-50 z-50' : ''}
        `}
      >
        <div className="p-6">
          {/* Drag Handle - visible on hover */}
          <div className="flex items-start gap-3 mb-4">
            <button
              className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-500 rounded transition-colors"
              {...attributes}
              {...listeners}
              aria-label="Przeciągnij aby zmienić kolejność"
              title="Przeciągnij aby zmienić kolejność"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8h16M4 16h16"
                />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 font-medium">
                Przeciągnij, aby zmienić kolejność
              </p>
            </div>
          </div>

          {/* Critical Alert Banner */}
          {hasCriticalLevels && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
              <svg
                className="w-4 h-4 text-red-600 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-xs font-medium text-red-800">
                Krytyczny poziom krwi!
              </p>
            </div>
          )}

          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                {name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="truncate">{city}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-mono">{code}</p>
            </div>

            {/* Priority Badge */}
            {priority && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                #{priority}
              </span>
            )}
          </div>

          {/* Address */}
          <p className="text-xs text-gray-500 mb-4 line-clamp-1" title={address}>
            {address}
          </p>

          {/* Blood Levels */}
          {currentBloodLevels && currentBloodLevels.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">
                Aktualne stany krwi:
              </p>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {currentBloodLevels.map((level) => (
                  <BloodLevelBadge
                    key={level.bloodGroup}
                    bloodLevel={level}
                    size="small"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p className="text-xs text-yellow-800">
                Brak danych o stanach krwi
              </p>
            </div>
          )}

          {/* Last Update */}
          {currentBloodLevels && currentBloodLevels.length > 0 && currentBloodLevels[0].lastUpdate && (
            <p className="text-xs text-gray-500 mb-4">
              Aktualizacja:{' '}
              {new Date(currentBloodLevels[0].lastUpdate).toLocaleDateString('pl-PL', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* View Details Button */}
            <a
              href={`/rckik/${rckikId}`}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Szczegóły
            </a>

            {/* Remove Button */}
            <button
              onClick={() => setIsRemoveModalOpen(true)}
              className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              title="Usuń z ulubionych"
              aria-label="Usuń z ulubionych"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Remove Confirmation Modal */}
      <ConfirmModal
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        onConfirm={handleRemove}
        title="Usuń z ulubionych?"
        message={`Czy na pewno chcesz usunąć ${name} (${city}) z listy ulubionych? Ta akcja jest nieodwracalna.`}
        confirmText="Usuń"
        cancelText="Anuluj"
        isDestructive
      />
    </>
  );
}
