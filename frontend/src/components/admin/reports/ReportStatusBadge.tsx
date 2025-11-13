import React from 'react';
import type { ReportStatus } from '@/lib/types/reports';

/**
 * ReportStatusBadge - Komponent wizualny dla statusów raportów
 * Wyświetla kolorowy badge z ikoną i tekstem statusu
 *
 * Wspiera statusy:
 * - NEW: niebieski - nowy raport
 * - IN_REVIEW: żółty - raport w trakcie weryfikacji
 * - RESOLVED: zielony - raport rozwiązany
 * - REJECTED: czerwony - raport odrzucony
 */

export interface ReportStatusBadgeProps {
  status: ReportStatus;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  className?: string;
}

/**
 * Konfiguracja kolorów, ikon i etykiet dla każdego statusu
 */
const statusConfig: Record<
  ReportStatus,
  {
    bgColor: string;
    textColor: string;
    icon: string;
    label: string;
  }
> = {
  NEW: {
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    icon: '●',
    label: 'Nowy',
  },
  IN_REVIEW: {
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    icon: '◐',
    label: 'W weryfikacji',
  },
  RESOLVED: {
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    icon: '✓',
    label: 'Rozwiązany',
  },
  REJECTED: {
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    icon: '✗',
    label: 'Odrzucony',
  },
};

/**
 * Mapowanie rozmiarów do klas Tailwind
 */
const sizeClasses = {
  small: 'text-xs px-2 py-0.5',
  medium: 'text-sm px-2.5 py-1',
  large: 'text-base px-3 py-1.5',
};

/**
 * ReportStatusBadge Component
 */
export function ReportStatusBadge({
  status,
  size = 'medium',
  showIcon = true,
  className = '',
}: ReportStatusBadgeProps) {
  const config = statusConfig[status];

  if (!config) {
    console.warn(`Unknown report status: ${status}`);
    return null;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.bgColor} ${config.textColor} ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label={`Status raportu: ${config.label}`}
    >
      {showIcon && (
        <span className="mr-1" aria-hidden="true">
          {config.icon}
        </span>
      )}
      <span>{config.label}</span>
    </span>
  );
}

/**
 * Helper function do pobierania etykiety statusu bez komponentu
 */
export function getReportStatusLabel(status: ReportStatus): string {
  return statusConfig[status]?.label || status;
}

/**
 * Helper function do pobierania koloru statusu (dla wykresów etc.)
 */
export function getReportStatusColor(status: ReportStatus): string {
  const colorMap: Record<ReportStatus, string> = {
    NEW: '#3B82F6', // blue-500
    IN_REVIEW: '#F59E0B', // yellow-500
    RESOLVED: '#10B981', // green-500
    REJECTED: '#EF4444', // red-500
  };
  return colorMap[status] || '#6B7280';
}
