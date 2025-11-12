import { BloodLevelBadge } from './BloodLevelBadge';
import { DataStatusBadge } from './DataStatusBadge';
import type { RckikCardProps } from '../../types/rckik';

/**
 * RckikCard - karta pojedynczego centrum krwiodawstwa
 * - Header: nazwa (H2), kod + miasto, DataStatusBadge (conditional)
 * - Address snippet
 * - BloodLevelsGrid: 8× BloodLevelBadge (grid 4×2 lub 2×4 na mobile)
 * - Footer: lastUpdate timestamp
 * - Cała karta jako link do /rckik/{id}
 * - Hover/focus states dla accessibility
 */
export function RckikCard({ rckik }: RckikCardProps) {
  // Format last update timestamp
  const formattedDate = new Date(rckik.lastUpdate).toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <article
      className="card group hover:shadow-lg transition-all duration-300
                 border border-gray-200 hover:border-primary-300"
    >
      <a
        href={`/rckik/${rckik.id}`}
        className="block focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-2xl"
      >
        {/* Header */}
        <header className="mb-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
              {rckik.name}
            </h2>

            {/* Data Status Badge (conditional) */}
            {rckik.dataStatus !== 'OK' && (
              <DataStatusBadge
                dataStatus={rckik.dataStatus}
                lastUpdate={rckik.lastUpdate}
              />
            )}
          </div>

          {/* Code + City */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md font-mono">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                />
              </svg>
              {rckik.code}
            </span>

            <span className="inline-flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
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
              {rckik.city}
            </span>
          </div>
        </header>

        {/* Address */}
        <address className="not-italic text-sm text-gray-600 mb-4">
          {rckik.address}
        </address>

        {/* Blood Levels Grid */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Aktualne stany krwi:
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {rckik.bloodLevels.map((bloodLevel) => (
              <BloodLevelBadge
                key={bloodLevel.bloodGroup}
                bloodLevel={bloodLevel}
                size="medium"
              />
            ))}
          </div>
        </div>

        {/* Footer - Last Update */}
        <footer className="pt-4 border-t border-gray-200">
          <time
            dateTime={rckik.lastUpdate}
            className="flex items-center gap-1.5 text-xs text-gray-500"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Ostatnia aktualizacja: {formattedDate}
          </time>
        </footer>
      </a>
    </article>
  );
}
