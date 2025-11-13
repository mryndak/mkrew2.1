import React from 'react';
import type { RunStatus, LogStatus, GlobalStatus } from '@/lib/types/scraper';

/**
 * StatusBadge - Reusable component dla wyświetlania statusów
 * Wspiera trzy typy statusów:
 * - GlobalStatus: OK, DEGRADED, FAILED
 * - RunStatus: RUNNING, COMPLETED, FAILED, PARTIAL
 * - LogStatus: SUCCESS, PARTIAL, FAILED
 */

type StatusType = RunStatus | LogStatus | GlobalStatus;

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

/**
 * Konfiguracja kolorów i ikon dla każdego statusu
 */
const statusConfig: Record<
  StatusType,
  {
    color: string;
    bgColor: string;
    textColor: string;
    icon: string;
    label: string;
  }
> = {
  // Global Status
  OK: {
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    icon: '✓',
    label: 'OK',
  },
  DEGRADED: {
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    icon: '⚠',
    label: 'Zdegradowany',
  },

  // Run Status
  RUNNING: {
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    icon: '▶',
    label: 'W trakcie',
  },
  COMPLETED: {
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    icon: '✓',
    label: 'Zakończony',
  },
  PARTIAL: {
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    icon: '⚠',
    label: 'Częściowy',
  },
  FAILED: {
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    icon: '✗',
    label: 'Błąd',
  },

  // Log Status
  SUCCESS: {
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    icon: '✓',
    label: 'Sukces',
  },
};

/**
 * Size mappings
 */
const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function StatusBadge({
  status,
  size = 'md',
  showIcon = true,
  className = '',
}: StatusBadgeProps) {
  const config = statusConfig[status];

  if (!config) {
    console.warn(`Unknown status: ${status}`);
    return null;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.bgColor} ${config.textColor} ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label={`Status: ${config.label}`}
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
 * Variant z pulsującą animacją dla statusu RUNNING
 */
interface PulsatingStatusBadgeProps extends StatusBadgeProps {
  animate?: boolean;
}

export function PulsatingStatusBadge({
  status,
  animate = true,
  ...props
}: PulsatingStatusBadgeProps) {
  const shouldAnimate = animate && status === 'RUNNING';

  return (
    <span className="relative inline-flex">
      <StatusBadge status={status} {...props} />
      {shouldAnimate && (
        <span className="absolute top-0 right-0 flex h-3 w-3 -mt-1 -mr-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
        </span>
      )}
    </span>
  );
}
