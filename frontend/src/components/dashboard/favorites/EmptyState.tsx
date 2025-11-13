/**
 * EmptyState - Stan pusty dla widoku ulubionych
 *
 * Features:
 * - Ikona serca
 * - Zachęcający komunikat
 * - Lista korzyści z dodania ulubionych
 * - CTA button prowadzący do /rckik
 * - Centrowany layout
 * - Responsywny design
 *
 * Displayed when:
 * - Użytkownik nie ma jeszcze żadnych ulubionych centrów
 * - Po pomyślnym pobraniu pustej listy z API
 *
 * @example
 * ```tsx
 * <EmptyState />
 * ```
 */
export function EmptyState() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-12">
      <div className="max-w-2xl mx-auto text-center">
        {/* Empty heart icon */}
        <div className="flex justify-center mb-6">
          <svg
            className="w-20 h-20 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Nie masz jeszcze ulubionych centrów
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-8 max-w-lg mx-auto">
          Dodaj centra krwiodawstwa do ulubionych, aby łatwo śledzić aktualne
          stany krwi i otrzymywać powiadomienia o krytycznych poziomach.
        </p>

        {/* Benefits list */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Korzyści z dodania ulubionych:
          </h3>
          <ul className="space-y-3">
            <BenefitItem
              icon={
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              }
              text="Szybki dostęp do aktualnych stanów krwi"
            />
            <BenefitItem
              icon={
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              }
              text="Powiadomienia o krytycznych poziomach krwi"
            />
            <BenefitItem
              icon={
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
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              }
              text="Personalizowana kolejność centrów"
            />
            <BenefitItem
              icon={
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              }
              text="Błyskawiczny przegląd najważniejszych informacji"
            />
          </ul>
        </div>

        {/* CTA Button */}
        <a
          href="/rckik"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
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
          Przeglądaj centra krwiodawstwa
        </a>
      </div>
    </div>
  );
}

/**
 * BenefitItem - Single benefit item with icon and text
 */
interface BenefitItemProps {
  icon: React.ReactNode;
  text: string;
}

function BenefitItem({ icon, text }: BenefitItemProps) {
  return (
    <li className="flex items-start gap-3">
      <div className="flex-shrink-0 text-primary-600 mt-0.5">{icon}</div>
      <span className="text-sm text-gray-700">{text}</span>
    </li>
  );
}
