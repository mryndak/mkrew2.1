import React from 'react';
import type { StatsData } from '@/lib/types/bloodSnapshots';

/**
 * Props dla StatsCards
 */
interface StatsCardsProps {
  stats: StatsData;
  isLoading: boolean;
}

/**
 * StatsCards - Karty ze statystykami ręcznych snapshotów
 *
 * Wyświetla 3 karty:
 * - Dzisiaj - liczba snapshotów dodanych dzisiaj
 * - Ten tydzień - ostatnie 7 dni
 * - Ten miesiąc - ostatnie 30 dni
 *
 * Features:
 * - Skeleton loading state
 * - Ikony dla każdej karty
 * - Responsywny grid (1/2/3 kolumny)
 *
 * US-028: Ręczne wprowadzanie stanów krwi
 */
export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const cards = [
    {
      title: 'Dzisiaj',
      value: stats.today,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Ten tydzień',
      value: stats.thisWeek,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Ten miesiąc',
      value: stats.thisMonth,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => (
        <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-md p-3 ${card.bgColor}`}>
                <div className={card.color}>{card.icon}</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{card.title}</dt>
                  <dd className="mt-1">
                    {isLoading ? (
                      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                    ) : (
                      <div className="text-3xl font-semibold text-gray-900">{card.value}</div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          {/* Progress bar - optional future enhancement */}
          {/* <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <a href="#" className="font-medium text-red-700 hover:text-red-900">
                Zobacz wszystkie
              </a>
            </div>
          </div> */}
        </div>
      ))}
    </div>
  );
}
