import { Tooltip } from '../../ui/Tooltip';
import type { BloodGroupSelectorProps, BloodGroup } from '@/types/rckik';

/**
 * BloodGroupSelector - selector do wyboru grupy krwi dla wykresu
 *
 * Zawiera:
 * - 8 przycisków dla wszystkich grup krwi (0+, 0-, A+, A-, B+, B-, AB+, AB-)
 * - Aktywny przycisk wyróżniony (border, background)
 * - Tooltips z aktualnymi poziomami dla każdej grupy
 * - Keyboard navigation (Tab, Enter, Space)
 * - Responsive (scroll horizontal na mobile jeśli konieczne)
 *
 * @example
 * ```tsx
 * <BloodGroupSelector
 *   selectedBloodGroup="A+"
 *   availableGroups={allGroups}
 *   currentLevels={rckik.currentBloodLevels}
 *   onChange={(group) => setSelectedGroup(group)}
 * />
 * ```
 */
export function BloodGroupSelector({
  selectedBloodGroup,
  availableGroups,
  currentLevels,
  onChange,
}: BloodGroupSelectorProps) {
  // Wszystkie grupy krwi w prawidłowej kolejności
  const ALL_BLOOD_GROUPS: BloodGroup[] = [
    '0+',
    '0-',
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
  ];

  // Helper do znalezienia aktualnego poziomu dla grupy
  const getCurrentLevel = (bloodGroup: BloodGroup) => {
    return currentLevels?.find((level) => level.bloodGroup === bloodGroup);
  };

  // Formatowanie tooltipa z aktualnym poziomem
  const getTooltipContent = (bloodGroup: BloodGroup) => {
    const level = getCurrentLevel(bloodGroup);
    if (!level) {
      return `${bloodGroup} - Brak danych`;
    }

    const statusLabels = {
      CRITICAL: 'Krytyczny',
      IMPORTANT: 'Ważny',
      OK: 'Wystarczający',
    };

    return (
      <div className="text-center">
        <div className="font-semibold mb-1">{bloodGroup}</div>
        <div className="text-sm">
          Poziom: {level.levelPercentage.toFixed(1)}%
        </div>
        <div className="text-xs opacity-90 mt-0.5">
          {statusLabels[level.levelStatus]}
        </div>
      </div>
    );
  };

  // Helper do określenia czy grupa jest dostępna
  const isGroupAvailable = (bloodGroup: BloodGroup) => {
    return availableGroups.includes(bloodGroup);
  };

  return (
    <div className="w-full">
      {/* Label */}
      <label
        id="blood-group-selector-label"
        className="block text-sm font-medium text-gray-700 mb-3"
      >
        Wybierz grupę krwi do wyświetlenia na wykresie:
      </label>

      {/* Buttons grid */}
      <div
        role="radiogroup"
        aria-labelledby="blood-group-selector-label"
        aria-required="false"
        className="grid grid-cols-4 sm:grid-cols-8 gap-2 w-full"
      >
        {ALL_BLOOD_GROUPS.map((bloodGroup) => {
          const isSelected = selectedBloodGroup === bloodGroup;
          const isAvailable = isGroupAvailable(bloodGroup);
          const level = getCurrentLevel(bloodGroup);

          // Klasy przycisku
          const buttonClasses = [
            'flex items-center justify-center px-3 py-2 rounded-lg border-2',
            'font-semibold text-sm transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
            isSelected
              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
              : isAvailable
              ? 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed',
            !isSelected && isAvailable && 'hover:shadow-sm',
          ]
            .filter(Boolean)
            .join(' ');

          const button = (
            <button
              key={bloodGroup}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Grupa krwi ${bloodGroup}${
                level ? `, poziom ${level.levelPercentage.toFixed(1)}%` : ''
              }`}
              disabled={!isAvailable}
              className={buttonClasses}
              onClick={() => {
                if (isAvailable) {
                  onChange(bloodGroup);
                }
              }}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && isAvailable) {
                  e.preventDefault();
                  onChange(bloodGroup);
                }
              }}
            >
              {bloodGroup}
              {/* Indicator dla aktualnego poziomu (optional dot) */}
              {level && (
                <span
                  className={[
                    'ml-1 w-2 h-2 rounded-full',
                    level.levelStatus === 'CRITICAL'
                      ? 'bg-red-500'
                      : level.levelStatus === 'IMPORTANT'
                      ? 'bg-orange-500'
                      : 'bg-green-500',
                    isSelected && 'bg-white',
                  ].join(' ')}
                  aria-hidden="true"
                />
              )}
            </button>
          );

          // Wrap z tooltipem jeśli dostępne
          if (isAvailable && currentLevels) {
            return (
              <Tooltip key={bloodGroup} content={getTooltipContent(bloodGroup)}>
                {button}
              </Tooltip>
            );
          }

          return button;
        })}
      </div>

      {/* Helper text */}
      <p className="text-xs text-gray-500 mt-3">
        {availableGroups.length === 8
          ? 'Wszystkie grupy krwi są dostępne'
          : `Dostępne grupy: ${availableGroups.length}/8`}
      </p>
    </div>
  );
}

/**
 * Compact version - mniejsza wersja dla ograniczonej przestrzeni
 * Używa tylko ikon/liter bez opisów
 */
export function CompactBloodGroupSelector({
  selectedBloodGroup,
  availableGroups,
  onChange,
}: Omit<BloodGroupSelectorProps, 'currentLevels'>) {
  const ALL_BLOOD_GROUPS: BloodGroup[] = [
    '0+',
    '0-',
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
  ];

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {ALL_BLOOD_GROUPS.map((bloodGroup) => {
        const isSelected = selectedBloodGroup === bloodGroup;
        const isAvailable = availableGroups.includes(bloodGroup);

        return (
          <button
            key={bloodGroup}
            type="button"
            disabled={!isAvailable}
            className={[
              'px-2 py-1 text-xs font-semibold rounded border transition-colors',
              isSelected
                ? 'bg-blue-600 text-white border-blue-600'
                : isAvailable
                ? 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed',
            ].join(' ')}
            onClick={() => {
              if (isAvailable) {
                onChange(bloodGroup);
              }
            }}
            aria-label={`Grupa krwi ${bloodGroup}`}
          >
            {bloodGroup}
          </button>
        );
      })}
    </div>
  );
}
