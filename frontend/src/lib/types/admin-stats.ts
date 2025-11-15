/**
 * Types for Admin Dashboard Statistics
 * Typy dla statystyk dashboardu administracyjnego
 */

/**
 * Admin Dashboard Statistics Response
 */
export interface AdminStatsResponse {
  totalRckikCenters: number;
  totalUsers: number;
  verifiedUsers: number;
  systemStatus: 'OPERATIONAL' | 'DEGRADED' | 'DOWN';
}
