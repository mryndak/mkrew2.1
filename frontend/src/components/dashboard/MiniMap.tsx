import { useMemo } from 'react';
import type { FavoriteRckikDto } from '@/types/dashboard';
import { Badge } from '@/components/ui';

export interface MiniMapProps {
  favorites: FavoriteRckikDto[];
  onCenterClick?: (rckikId: number) => void;
}

/**
 * MiniMap - Mini mapa Polski pokazująca krytyczne stany krwi w centrach
 *
 * Features:
 * - Uproszczona mapa Polski (SVG)
 * - Markery dla centrów RCKiK z krytycznymi stanami
 * - Tooltip z informacją o poziomach krwi
 * - Kliknięcie markera → szczegóły centrum
 *
 * @example
 * ```tsx
 * <MiniMap
 *   favorites={favorites}
 *   onCenterClick={(id) => navigate(`/rckik/${id}`)}
 * />
 * ```
 */
export function MiniMap({ favorites, onCenterClick }: MiniMapProps) {
  // Filtruj centra z krytycznymi stanami
  const centersWithCriticalLevels = useMemo(() => {
    return favorites.filter((fav) =>
      fav.currentBloodLevels?.some((level) => level.levelStatus === 'CRITICAL')
    );
  }, [favorites]);

  // Bounds mapy Polski (przybliżone)
  const POLAND_BOUNDS = {
    minLat: 49.0,
    maxLat: 54.9,
    minLng: 14.1,
    maxLng: 24.2,
  };

  // Konwersja współrzędnych geograficznych na pozycję SVG
  const latLngToSvgPosition = (lat: number, lng: number) => {
    const x =
      ((lng - POLAND_BOUNDS.minLng) / (POLAND_BOUNDS.maxLng - POLAND_BOUNDS.minLng)) * 100;
    const y =
      100 - ((lat - POLAND_BOUNDS.minLat) / (POLAND_BOUNDS.maxLat - POLAND_BOUNDS.minLat)) * 100;
    return { x, y };
  };

  // Zlicz krytyczne grupy krwi dla centrum
  const getCriticalCount = (fav: FavoriteRckikDto) => {
    return fav.currentBloodLevels?.filter((level) => level.levelStatus === 'CRITICAL').length || 0;
  };

  if (centersWithCriticalLevels.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <div className="text-gray-400 mb-2">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">Brak krytycznych stanów</h3>
        <p className="text-xs text-gray-600">
          Wszystkie ulubione centra mają wystarczające zapasy krwi.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Krytyczne stany krwi</h3>
          <Badge variant="error" size="small">
            {centersWithCriticalLevels.length} {centersWithCriticalLevels.length === 1 ? 'centrum' : 'centra'}
          </Badge>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Centra z niedoborami w Twoich ulubionych
        </p>
      </div>

      {/* Map SVG */}
      <div className="p-4">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-auto bg-gray-50 rounded-lg border border-gray-200"
          style={{ minHeight: '250px', maxHeight: '350px' }}
        >
          {/* Uproszczona mapa Polski (kontury) */}
          <PolandOutline />

          {/* Markery dla centrów z krytycznymi stanami */}
          {centersWithCriticalLevels.map((fav) => {
            if (!fav.latitude || !fav.longitude) return null;

            const { x, y } = latLngToSvgPosition(fav.latitude, fav.longitude);
            const criticalCount = getCriticalCount(fav);

            return (
              <g key={fav.id}>
                {/* Marker circle */}
                <circle
                  cx={x}
                  cy={y}
                  r="3"
                  className="fill-red-600 stroke-white stroke-[0.5] cursor-pointer hover:fill-red-700 transition-colors"
                  onClick={() => onCenterClick?.(fav.rckikId)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${fav.name} - ${criticalCount} ${criticalCount === 1 ? 'krytyczna grupa' : 'krytyczne grupy'}`}
                >
                  <title>
                    {fav.name} ({fav.city})
                    {'\n'}
                    {criticalCount} {criticalCount === 1 ? 'krytyczna grupa krwi' : 'krytyczne grupy krwi'}
                  </title>
                </circle>

                {/* Pulsujący efekt dla szczególnie krytycznych */}
                {criticalCount >= 3 && (
                  <circle
                    cx={x}
                    cy={y}
                    r="3"
                    className="fill-red-600 opacity-0 animate-ping"
                    style={{ animationDuration: '2s' }}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend & List */}
      <div className="px-4 pb-4">
        <div className="space-y-2">
          {centersWithCriticalLevels.slice(0, 5).map((fav) => {
            const criticalCount = getCriticalCount(fav);
            const criticalGroups = fav.currentBloodLevels
              ?.filter((level) => level.levelStatus === 'CRITICAL')
              .map((level) => level.bloodGroup);

            return (
              <button
                key={fav.id}
                onClick={() => onCenterClick?.(fav.rckikId)}
                className="w-full flex items-start justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors text-left group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0" />
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                      {fav.name}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 ml-4">{fav.city}</p>
                  {criticalGroups && criticalGroups.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 ml-4">
                      {criticalGroups.map((group) => (
                        <Badge key={group} variant="error" size="small">
                          {group}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <svg
                  className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 group-hover:text-primary-600 transition-colors"
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
              </button>
            );
          })}
        </div>

        {centersWithCriticalLevels.length > 5 && (
          <p className="text-xs text-gray-600 text-center mt-3">
            i {centersWithCriticalLevels.length - 5} więcej...
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * PolandOutline - Uproszczone kontury Polski dla SVG
 * Współrzędne przybliżone dla celów wizualizacji
 */
function PolandOutline() {
  return (
    <g className="fill-none stroke-gray-300 stroke-[0.5]">
      {/* Uproszczone kontury granic Polski */}
      <path
        d="M 15,20 L 20,15 L 30,15 L 40,10 L 55,10 L 65,15 L 75,20 L 80,30 L 85,40 L 85,50 L 80,60 L 75,70 L 70,80 L 60,88 L 50,90 L 40,90 L 30,88 L 20,80 L 15,70 L 12,60 L 10,50 L 10,40 L 12,30 L 15,20 Z"
        className="fill-gray-100"
      />
    </g>
  );
}
