/**
 * QuickActionsPanel - Panel szybkich akcji Dashboard
 *
 * Features:
 * - 3 główne akcje: Dodaj donację, Zobacz ulubione, Szukaj centrum
 * - Responsywny grid (3 kolumny desktop, 1 kolumna mobile)
 * - Primary action (Dodaj donację) wyróżniona
 * - Ikony dla każdej akcji
 *
 * @example
 * ```tsx
 * <QuickActionsPanel />
 * ```
 */
export function QuickActionsPanel() {
  const quickActions = [
    {
      id: 'add-donation',
      label: 'Dodaj donację',
      href: '/dashboard/donations',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      ),
      variant: 'primary' as const,
    },
    {
      id: 'view-favorites',
      label: 'Zobacz ulubione',
      href: '/dashboard/favorites',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      ),
      variant: 'secondary' as const,
    },
    {
      id: 'search-center',
      label: 'Szukaj centrum',
      href: '/rckik',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
      variant: 'secondary' as const,
    },
  ];

  const getButtonClasses = (variant: 'primary' | 'secondary') => {
    if (variant === 'primary') {
      return 'bg-primary-600 text-white hover:bg-primary-700 border-primary-600';
    }
    return 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300';
  };

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg
          className="w-6 h-6 text-primary-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        Szybkie akcje
      </h2>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {quickActions.map((action) => (
          <a
            key={action.id}
            href={action.href}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border font-medium transition-all duration-200 ${getButtonClasses(
              action.variant
            )}`}
          >
            {action.icon}
            <span>{action.label}</span>
          </a>
        ))}
      </div>

      {/* Quick tip */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800 flex items-start gap-2">
          <svg
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            <strong>Wskazówka:</strong> Dodaj swoje ulubione centra, aby szybko
            śledzić krytyczne poziomy krwi i otrzymywać powiadomienia.
          </span>
        </p>
      </div>
    </section>
  );
}
