/**
 * Blood group constants
 * Single source of truth for all blood groups in the application
 */

/**
 * All possible blood groups in display order
 * Order: RH+ groups first, then RH- groups
 */
export const ALL_BLOOD_GROUPS = [
  '0+',
  '0-',
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
] as const;

/**
 * Blood group type derived from the array
 */
export type BloodGroup = (typeof ALL_BLOOD_GROUPS)[number];

/**
 * Blood group labels for display
 * Matches the backend BloodGroup enum
 */
export const BLOOD_GROUP_LABELS: Record<BloodGroup, string> = {
  '0+': '0 Rh+',
  '0-': '0 Rh-',
  'A+': 'A Rh+',
  'A-': 'A Rh-',
  'B+': 'B Rh+',
  'B-': 'B Rh-',
  'AB+': 'AB Rh+',
  'AB-': 'AB Rh-',
};

/**
 * Blood group colors for visualization (if needed)
 */
export const BLOOD_GROUP_COLORS: Record<BloodGroup, string> = {
  '0+': '#3b82f6', // blue-500
  '0-': '#60a5fa', // blue-400
  'A+': '#ef4444', // red-500
  'A-': '#f87171', // red-400
  'B+': '#f59e0b', // amber-500
  'B-': '#fbbf24', // amber-400
  'AB+': '#8b5cf6', // violet-500
  'AB-': '#a78bfa', // violet-400
};

/**
 * Check if a string is a valid blood group
 *
 * @param value - String to check
 * @returns True if value is a valid blood group
 *
 * @example
 * isValidBloodGroup('A+') // true
 * isValidBloodGroup('invalid') // false
 */
export const isValidBloodGroup = (value: string): value is BloodGroup => {
  return ALL_BLOOD_GROUPS.includes(value as BloodGroup);
};

/**
 * Get blood group label with Rh factor
 *
 * @param bloodGroup - Blood group code
 * @returns Formatted label with Rh factor
 *
 * @example
 * getBloodGroupLabel('A+') // "A Rh+"
 */
export const getBloodGroupLabel = (bloodGroup: BloodGroup): string => {
  return BLOOD_GROUP_LABELS[bloodGroup];
};
