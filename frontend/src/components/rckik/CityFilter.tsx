import { Select } from '../ui/Select';
import type { CityFilterProps } from '../../types/rckik';

/**
 * CityFilter - dropdown do wyboru miasta
 * - Opcja "Wszystkie miasta" jako default
 * - Lista unikalnych miast z bazy RCKiK
 * - Callback onChange z wybranym miastem (lub null dla wszystkich)
 */
export function CityFilter({ value, cities, onChange }: CityFilterProps) {
  // Przygotuj options dla Select component
  const options = [
    { value: '', label: 'Wszystkie miasta' },
    ...cities.map(city => ({
      value: city,
      label: city
    }))
  ];

  // Handle change
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    // Przekaż null jeśli wybrano "Wszystkie miasta", inaczej nazwę miasta
    onChange(selectedValue === '' ? null : selectedValue);
  };

  return (
    <Select
      label="Miasto"
      options={options}
      value={value || ''}
      onChange={handleChange}
      className="w-full"
      aria-label="Filtruj centra krwiodawstwa po mieście"
    />
  );
}
