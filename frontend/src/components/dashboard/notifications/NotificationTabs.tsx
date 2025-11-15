/**
 * NotificationTabs - Komponent nawigacyjny z tabami
 *
 * Features:
 * - Przełączanie między widokami "Wszystkie" i "Nieprzeczytane"
 * - Badge z licznikiem nieprzeczytanych przy tabie "Nieprzeczytane"
 * - Keyboard navigation (Tab, Enter, Space)
 * - Active state styling
 * - Accessibility (ARIA labels, roles)
 * - Responsywny design
 *
 * Props:
 * - activeTab: 'all' | 'unread' - aktywny tab
 * - unreadCount: number - liczba nieprzeczytanych powiadomień
 * - onTabChange: (tab: TabType) => void - callback zmiany taba
 *
 * @example
 * ```tsx
 * <NotificationTabs
 *   activeTab="all"
 *   unreadCount={5}
 *   onTabChange={(tab) => console.log('Tab changed:', tab)}
 * />
 * ```
 */

type TabType = 'all' | 'unread';

interface NotificationTabsProps {
  activeTab: TabType;
  unreadCount: number;
  onTabChange: (tab: TabType) => void;
}

export function NotificationTabs({
  activeTab,
  unreadCount,
  onTabChange,
}: NotificationTabsProps) {
  return (
    <div className="mb-6" data-test-id="notification-tabs-container">
      <div
        className="border-b border-gray-200"
        role="tablist"
        aria-label="Filtrowanie powiadomień"
      >
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {/* Tab: Wszystkie */}
          <button
            role="tab"
            aria-selected={activeTab === 'all'}
            aria-controls="notifications-panel-all"
            id="tab-all"
            onClick={() => onTabChange('all')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
              ${
                activeTab === 'all'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
            data-test-id="notification-tab-all"
          >
            Wszystkie
          </button>

          {/* Tab: Nieprzeczytane */}
          <button
            role="tab"
            aria-selected={activeTab === 'unread'}
            aria-controls="notifications-panel-unread"
            id="tab-unread"
            onClick={() => onTabChange('unread')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
              inline-flex items-center gap-2
              ${
                activeTab === 'unread'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
            data-test-id="notification-tab-unread"
          >
            Nieprzeczytane
            {/* Badge with unread count */}
            {unreadCount > 0 && (
              <span
                className={`
                  inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full
                  ${
                    activeTab === 'unread'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }
                `}
                aria-label={`${unreadCount} nieprzeczytanych powiadomień`}
                data-test-id="notification-unread-badge"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </div>
  );
}
