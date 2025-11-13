import type { WelcomeSectionProps } from '@/types/dashboard';

/**
 * WelcomeSection - Sekcja powitalna Dashboard
 *
 * Features:
 * - Spersonalizowana wiadomość z imieniem użytkownika
 * - Wyświetlenie grupy krwi (jeśli ustawiona)
 * - Responsywny design
 *
 * @example
 * ```tsx
 * <WelcomeSection
 *   firstName="Jan"
 *   bloodGroup="A+"
 * />
 * ```
 */
export function WelcomeSection({ firstName, bloodGroup }: WelcomeSectionProps) {
  // Fallback do "Witaj!" jeśli brak imienia
  const greeting = firstName ? `Witaj, ${firstName}!` : 'Witaj!';

  // Formatuj czas dnia
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Dzień dobry';
    if (hour < 18) return 'Dzień dobry';
    return 'Dobry wieczór';
  };

  return (
    <section className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-md p-6 sm:p-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Welcome message */}
        <div className="flex-1">
          <p className="text-sm font-medium text-primary-100 mb-1">
            {getTimeOfDay()}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{greeting}</h1>
          <p className="text-primary-100 text-sm">
            Witamy z powrotem w Twoim panelu dawcy krwi
          </p>
        </div>

        {/* Blood group badge */}
        {bloodGroup && (
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-3 border border-white border-opacity-30">
              <p className="text-xs font-medium text-primary-100 mb-1">
                Twoja grupa krwi
              </p>
              <p className="text-2xl font-bold text-white">{bloodGroup}</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick tip */}
      <div className="mt-6 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-20">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg
              className="w-5 h-5 text-primary-100"
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
          </div>
          <div className="flex-1">
            <p className="text-sm text-white font-medium mb-1">
              Czy wiesz, że...
            </p>
            <p className="text-xs text-primary-100">
              Jedna donacja krwi może uratować nawet 3 życia. Dziękujemy za Twoją
              szlachetność!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
