// ===== API Response Types (mapowane z backendu) =====

/**
 * User profile response
 * Backend: UserProfileResponse.java
 */
export interface UserProfileResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  bloodGroup: string | null;
  emailVerified: boolean;
  consentTimestamp: string; // ISO 8601
  consentVersion: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Donation statistics
 * Backend: DonationStatisticsDto.java
 */
export interface DonationStatisticsDto {
  totalDonations: number;
  totalQuantityMl: number;
  lastDonationDate: string | null; // ISO date "2025-01-05"
}

/**
 * Basic RCKiK info
 * Backend: RckikBasicDto.java
 */
export interface RckikBasicDto {
  id: number;
  name: string;
  code: string;
  city?: string;
}

/**
 * Donation response
 * Backend: DonationResponse.java
 */
export interface DonationResponse {
  id: number;
  rckik: RckikBasicDto;
  donationDate: string; // ISO date
  quantityMl: number;
  donationType: DonationType;
  notes: string | null;
  confirmed: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Donation list response with pagination and statistics
 * Backend: DonationListResponse.java
 */
export interface DonationListResponse {
  donations: DonationResponse[];
  page: number;
  size: number;
  totalElements: number;
  statistics: DonationStatisticsDto;
}

/**
 * Blood level for specific blood group
 * Backend: BloodLevelDto.java
 */
export interface BloodLevelDto {
  bloodGroup: string;
  levelPercentage: number;
  levelStatus: 'CRITICAL' | 'IMPORTANT' | 'OK';
  lastUpdate: string; // ISO 8601
}

/**
 * Favorite RCKiK with current blood levels
 * Backend: FavoriteRckikDto.java
 */
export interface FavoriteRckikDto {
  id: number;
  rckikId: number;
  name: string;
  code: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
  priority: number | null;
  addedAt: string; // ISO 8601
  currentBloodLevels: BloodLevelDto[];
}

/**
 * In-app notification DTO
 * Backend: InAppNotificationDto.java
 */
export interface InAppNotificationDto {
  id: number;
  type: string;
  rckik: { id: number; name: string } | null;
  title: string;
  message: string;
  linkUrl: string | null;
  readAt: string | null; // ISO 8601
  expiresAt: string | null; // ISO 8601
  createdAt: string; // ISO 8601
}

/**
 * In-app notifications response with pagination
 * Backend: InAppNotificationsResponse.java
 */
export interface InAppNotificationsResponse {
  notifications: InAppNotificationDto[];
  page: number;
  size: number;
  totalElements: number;
  unreadCount: number;
}

/**
 * Unread notifications count response
 * Backend: UnreadCountResponse.java
 */
export interface UnreadCountResponse {
  unreadCount: number;
}

// ===== Enums and Literals =====

/**
 * Donation types
 */
export type DonationType = 'FULL_BLOOD' | 'PLASMA' | 'PLATELETS' | 'OTHER';

/**
 * Blood groups
 */
export type BloodGroup = '0+' | '0-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';

/**
 * Blood level statuses
 */
export type BloodLevelStatus = 'CRITICAL' | 'IMPORTANT' | 'OK';

/**
 * Notification types
 */
export type NotificationType =
  | 'CRITICAL_BLOOD_LEVEL'
  | 'SYSTEM_ALERT'
  | 'DONATION_REMINDER'
  | 'OTHER';

// ===== Frontend ViewModels =====

/**
 * Aggregated dashboard data (SSR + client-side)
 */
export interface DashboardData {
  user: UserProfileResponse;
  statistics: DonationStatisticsDto;
  recentDonations: DonationResponse[];
  favorites: FavoriteRckikDto[];
  notifications: InAppNotificationDto[];
  unreadNotificationsCount: number;
  nextEligibleDonationDate: string | null; // ISO date
}

/**
 * Next donation eligibility info
 */
export interface NextDonationInfo {
  date: string | null; // ISO date
  daysRemaining: number | null;
  isEligible: boolean;
}

/**
 * Stats card data for dashboard cards
 */
export interface StatsCardData {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  additionalInfo?: string;
  linkTo?: string;
}

/**
 * Quick action data
 */
export interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
}

// ===== Component Props Types =====

/**
 * Props dla WelcomeSection
 */
export interface WelcomeSectionProps {
  firstName: string | null;
  bloodGroup: string | null;
}

/**
 * Props dla StatsCardsGrid
 */
export interface StatsCardsGridProps {
  statistics: DonationStatisticsDto;
  nextDonationInfo: NextDonationInfo;
}

/**
 * Props dla StatsCard
 */
export interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  additionalInfo?: string;
  linkTo?: string;
  onClick?: () => void;
}

/**
 * Props dla FavoritesWidget
 */
export interface FavoritesWidgetProps {
  favorites: FavoriteRckikDto[];
}

/**
 * Props dla FavoriteCard
 */
export interface FavoriteCardProps {
  favorite: FavoriteRckikDto;
  onClick: (rckikId: number) => void;
}

/**
 * Props dla NotificationsWidget
 */
export interface NotificationsWidgetProps {
  notifications: InAppNotificationDto[];
  unreadCount: number;
}

/**
 * Props dla NotificationItem
 */
export interface NotificationItemProps {
  notification: InAppNotificationDto;
  onRead: (notificationId: number) => void;
}

/**
 * Props dla RecentDonationsTimeline
 */
export interface RecentDonationsTimelineProps {
  donations: DonationResponse[];
}

/**
 * Props dla DonationTimelineItem
 */
export interface DonationTimelineItemProps {
  donation: DonationResponse;
  onClick?: (donationId: number) => void;
}

/**
 * Props dla QuickActionsPanel
 */
export interface QuickActionsPanelProps {
  // Brak propsów - statyczny komponent
}

/**
 * Props dla QuickActionButton
 */
export interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

// ===== Constants and Configurations =====

/**
 * Donation type labels (Polish)
 */
export const DONATION_TYPE_LABELS: Record<DonationType, string> = {
  FULL_BLOOD: 'Krew pełna',
  PLASMA: 'Osocze',
  PLATELETS: 'Płytki krwi',
  OTHER: 'Inne',
};

/**
 * Blood level status colors
 */
export const BLOOD_LEVEL_STATUS_COLORS: Record<BloodLevelStatus, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-300',
  IMPORTANT: 'bg-orange-100 text-orange-800 border-orange-300',
  OK: 'bg-green-100 text-green-800 border-green-300',
};

/**
 * Days between full blood donations
 */
export const DAYS_BETWEEN_DONATIONS = 56;

// ===== Utility Functions =====

/**
 * Calculate next eligible donation date
 * @param lastDonationDate ISO date string of last donation
 * @returns ISO date string of next eligible donation or null
 */
export function calculateNextEligibleDate(
  lastDonationDate: string | null
): string | null {
  if (!lastDonationDate) return null;

  const lastDate = new Date(lastDonationDate);

  // Check if date is valid
  if (isNaN(lastDate.getTime())) {
    return null;
  }

  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + DAYS_BETWEEN_DONATIONS);

  return nextDate.toISOString().split('T')[0];
}

/**
 * Calculate days remaining until next eligible donation
 * @param lastDonationDate ISO date string of last donation
 * @returns number of days remaining (0 if eligible now)
 */
export function getDaysRemaining(lastDonationDate: string | null): number | null {
  if (!lastDonationDate) return null;

  const nextEligibleDate = calculateNextEligibleDate(lastDonationDate);
  if (!nextEligibleDate) return null;

  const today = new Date();
  const nextDate = new Date(nextEligibleDate);
  const diffTime = nextDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Check if user is eligible to donate
 * @param lastDonationDate ISO date string of last donation
 * @returns true if eligible, false otherwise
 */
export function isEligibleToDonate(lastDonationDate: string | null): boolean {
  if (!lastDonationDate) return true;

  const daysRemaining = getDaysRemaining(lastDonationDate);
  return daysRemaining === null || daysRemaining <= 0;
}
