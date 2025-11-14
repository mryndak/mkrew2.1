import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { useBloodLevelHistory } from '@/lib/hooks/useBloodLevelHistory';
import { BloodGroupSelector } from './BloodGroupSelector';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import type { BloodLevelChartProps, ChartDataPoint, BloodGroup } from '@/types/rckik';

/**
 * BloodLevelChart - interaktywny wykres liniowy trendu poziomów krwi
 *
 * Używa biblioteki Recharts do wizualizacji danych historycznych.
 * Pokazuje trend poziomu krwi dla wybranej grupy w ciągu ostatnich 30 dni.
 *
 * Funkcje:
 * - Selector grup krwi (BloodGroupSelector)
 * - Wykres liniowy z kolorami zależnymi od statusu
 * - Reference lines dla progów (20% - krytyczny, 50% - ważny)
 * - Tooltip z szczegółowymi danymi
 * - Loading/Error/Empty states
 *
 * @example
 * ```tsx
 * <BloodLevelChart
 *   rckikId={1}
 *   initialBloodGroup="A+"
 * />
 * ```
 */
export function BloodLevelChart({
  rckikId,
  initialBloodGroup = '0+',
  onBloodGroupChange,
}: BloodLevelChartProps) {
  const [selectedBloodGroup, setSelectedBloodGroup] =
    useState<BloodGroup>(initialBloodGroup);

  // Calculate date range (ostatnie 30 dni)
  const fromDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }, []);

  // Fetch history dla wybranej grupy krwi
  const { snapshots, loading, error, refetch } = useBloodLevelHistory(
    rckikId,
    {
      bloodGroup: selectedBloodGroup,
      fromDate,
      size: 100, // Pobierz więcej dla lepszego wykresu
    }
  );

  // Transform data do formatu Recharts
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return [];

    return snapshots
      .map((snapshot) => ({
        date: formatDateShort(snapshot.snapshotDate), // "08.01"
        fullDate: snapshot.snapshotDate, // "2025-01-08"
        percentage: Number(snapshot.levelPercentage),
        status: snapshot.levelStatus,
        timestamp: snapshot.scrapedAt,
      }))
      .reverse(); // Oldest first for chart
  }, [snapshots]);

  // Helper do formatowania daty (DD.MM)
  const formatDateShort = (isoDate: string) => {
    try {
      const [, month, day] = isoDate.split('-');
      return `${day}.${month}`;
    } catch {
      return isoDate;
    }
  };

  // Helper do formatowania pełnej daty dla tooltip
  const formatDateFull = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return isoDate;
    }
  };

  // Custom Tooltip dla wykresu
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) return null;

    const data = payload[0].payload as ChartDataPoint;
    const statusLabels = {
      CRITICAL: 'Krytyczny',
      IMPORTANT: 'Ważny',
      OK: 'Wystarczający',
    };

    const statusColors = {
      CRITICAL: 'text-red-600',
      IMPORTANT: 'text-orange-600',
      OK: 'text-green-600',
    };

    return (
      <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-3">
        <p className="font-semibold text-gray-900 mb-2">
          {formatDateFull(data.fullDate)}
        </p>
        <div className="space-y-1 text-sm">
          <p className="text-gray-700">
            Poziom: <span className="font-semibold">{data.percentage.toFixed(1)}%</span>
          </p>
          <p className={`font-medium ${statusColors[data.status]}`}>
            Status: {statusLabels[data.status]}
          </p>
        </div>
      </div>
    );
  };

  // Handle blood group change
  const handleBloodGroupChange = (bloodGroup: BloodGroup) => {
    setSelectedBloodGroup(bloodGroup);
    onBloodGroupChange?.(bloodGroup);
  };

  // Get all available blood groups (wszystkie 8 grup)
  const availableGroups = useMemo(() => {
    return ['0+', '0-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as BloodGroup[];
  }, []);

  // Get current levels for tooltips w selektorze (z fetchowanych snapshotów)
  const currentLevels = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return undefined;

    // Get latest snapshot dla każdej grupy
    const latestByGroup = snapshots.reduce((acc, item) => {
      if (
        !acc[item.bloodGroup] ||
        new Date(item.snapshotDate) > new Date(acc[item.bloodGroup].snapshotDate)
      ) {
        acc[item.bloodGroup] = item;
      }
      return acc;
    }, {} as Record<string, typeof snapshots[0]>);

    return Object.values(latestByGroup).map((item) => ({
      bloodGroup: item.bloodGroup,
      levelPercentage: Number(item.levelPercentage),
      levelStatus: item.levelStatus,
      lastUpdate: item.scrapedAt,
    }));
  }, [snapshots]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" role="status" aria-live="polite">
        <span className="sr-only">Ładowanie wykresu trendu poziomów krwi...</span>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Trend poziomu krwi - ostatnie 30 dni
        </h2>
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  // Empty state
  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Trend poziomu krwi - ostatnie 30 dni
        </h2>

        <BloodGroupSelector
          selectedBloodGroup={selectedBloodGroup}
          availableGroups={availableGroups}
          currentLevels={currentLevels}
          onChange={handleBloodGroupChange}
        />

        <div className="mt-6">
          <EmptyState
            title="Brak danych historycznych"
            message={`Brak danych dla grupy krwi ${selectedBloodGroup} w ciągu ostatnich 30 dni`}
            onReset={() => {
              // Try pierwsza dostępna grupa
              if (availableGroups.length > 0) {
                handleBloodGroupChange(availableGroups[0]);
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      {/* Title */}
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
        Trend poziomu krwi - ostatnie 30 dni
      </h2>

      {/* Blood Group Selector */}
      <div className="mb-6">
        <BloodGroupSelector
          selectedBloodGroup={selectedBloodGroup}
          availableGroups={availableGroups}
          currentLevels={currentLevels}
          onChange={handleBloodGroupChange}
        />
      </div>

      {/* Chart */}
      <div
        className="w-full h-64 sm:h-80"
        role="img"
        aria-label={`Wykres liniowy pokazujący trend poziomu krwi dla grupy ${selectedBloodGroup} w ciągu ostatnich 30 dni`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

            {/* X Axis - Dates */}
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={{ stroke: '#9ca3af' }}
              axisLine={{ stroke: '#d1d5db' }}
            />

            {/* Y Axis - Percentage */}
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={{ stroke: '#9ca3af' }}
              axisLine={{ stroke: '#d1d5db' }}
              label={{
                value: 'Poziom (%)',
                angle: -90,
                position: 'insideLeft',
                style: { fill: '#4b5563', fontSize: 14 },
              }}
            />

            {/* Tooltip */}
            <Tooltip content={<CustomTooltip />} />

            {/* Legend */}
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '14px',
              }}
            />

            {/* Reference Lines - Progi */}
            <ReferenceLine
              y={20}
              stroke="#ef4444"
              strokeDasharray="5 5"
              label={{
                value: 'Krytyczny (20%)',
                position: 'right',
                fill: '#ef4444',
                fontSize: 12,
              }}
            />
            <ReferenceLine
              y={50}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              label={{
                value: 'Ważny (50%)',
                position: 'right',
                fill: '#f59e0b',
                fontSize: 12,
              }}
            />

            {/* Line - Główny wykres */}
            <Line
              type="monotone"
              dataKey="percentage"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name={`Grupa ${selectedBloodGroup}`}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Info text */}
      <p className="text-sm text-gray-500 mt-4">
        Wykres pokazuje historyczne poziomy krwi dla grupy {selectedBloodGroup} w ciągu
        ostatnich 30 dni. Dane są aktualizowane automatycznie co noc.
      </p>
    </div>
  );
}
