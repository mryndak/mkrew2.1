import { useState, useEffect } from 'react';
import type { FavoriteRckikDto } from '@/types/rckik';
import { FavoriteCardItem } from './FavoriteCardItem';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useAppDispatch } from '@/lib/store';
import {
  updateFavoritesOrder,
  reorderFavoritesOptimistic,
  rollbackReorder,
} from '@/lib/store/slices/favoritesSlice';
import { toast } from 'sonner';

/**
 * FavoritesList - Lista ulubionych centrów z drag-and-drop
 *
 * Features:
 * - Grid layout responsywny (1/2/3 kolumny)
 * - Drag-and-drop reordering (mouse, touch, keyboard)
 * - Optimistic updates z rollback przy błędzie
 * - Auto-save po upuszczeniu elementu
 * - DragOverlay dla lepszej wizualizacji
 * - Keyboard navigation (Space/Enter + Arrow keys)
 * - Touch support na mobile
 * - Accessibility (ARIA labels)
 *
 * Layout:
 * - Mobile: 1 kolumna
 * - Tablet: 2 kolumny
 * - Desktop: 3 kolumny
 *
 * @example
 * ```tsx
 * <FavoritesList favorites={favoritesData} />
 * ```
 */

interface FavoritesListProps {
  favorites: FavoriteRckikDto[];
}

export function FavoritesList({ favorites }: FavoritesListProps) {
  const dispatch = useAppDispatch();
  const [localFavorites, setLocalFavorites] = useState(favorites);
  const [activeId, setActiveId] = useState<number | null>(null);

  // Sync local state when favorites prop changes
  useEffect(() => {
    setLocalFavorites(favorites);
  }, [favorites]);

  // Configure sensors for drag interactions
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before dragging starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms delay for touch to avoid conflicts with scrolling
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  // Handle drag end with optimistic update
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localFavorites.findIndex((f) => f.id === active.id);
    const newIndex = localFavorites.findIndex((f) => f.id === over.id);

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
      return;
    }

    // Save previous order for rollback
    const previousOrder = [...localFavorites];

    // Optimistic update - reorder locally
    const newOrder = arrayMove(localFavorites, oldIndex, newIndex);
    setLocalFavorites(newOrder);
    dispatch(reorderFavoritesOptimistic(newOrder));

    try {
      // Save to backend
      await dispatch(updateFavoritesOrder(newOrder)).unwrap();
      // Silent success - no toast needed for successful reordering
    } catch (error: any) {
      // Rollback on error
      setLocalFavorites(previousOrder);
      dispatch(rollbackReorder(previousOrder));
      toast.error(error || 'Nie udało się zapisać kolejności. Spróbuj ponownie.');
    }
  };

  if (localFavorites.length === 0) {
    return null;
  }

  // Find active favorite for drag overlay
  const activeFavorite = activeId
    ? localFavorites.find((f) => f.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localFavorites.map((f) => f.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {localFavorites.map((favorite, index) => (
            <FavoriteCardItem
              key={favorite.id}
              favorite={favorite}
              index={index}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag Overlay - pokazuje przeciągany element */}
      <DragOverlay>
        {activeFavorite ? (
          <div className="opacity-90 rotate-3 scale-105 transition-transform">
            <FavoriteCardItem
              favorite={activeFavorite}
              index={localFavorites.findIndex((f) => f.id === activeId)}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
